import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { appendRowsToGoogleSheet, clearAndSeedGoogleSheet } from "@/lib/google-sheets";

const PAYMENT_HEADERS = [
  "Date",
  "Customer Name",
  "Phone",
  "Savings Plan",
  "Plan Type",
  "Payment Channel",
  "Amount (NGN)",
  "Payment Status",
  "Reference",
];

function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ?? "";
}

function getPaymentsSheetName() {
  return process.env.GOOGLE_SHEETS_PAYMENTS_SHEET_NAME?.trim() || "PaymentEvents";
}

function getDailyPaymentsSheetName() {
  return process.env.GOOGLE_SHEETS_DAILY_PAYMENTS_SHEET_NAME?.trim() || "DailyPayments";
}

function getWeeklyPaymentsSheetName() {
  return process.env.GOOGLE_SHEETS_WEEKLY_PAYMENTS_SHEET_NAME?.trim() || "WeeklyPayments";
}

function getMonthlyPaymentsSheetName() {
  return process.env.GOOGLE_SHEETS_MONTHLY_PAYMENTS_SHEET_NAME?.trim() || "MonthlyPayments";
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error;

  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEETS_SPREADSHEET_ID." },
      { status: 400 },
    );
  }

  const legacySheetName = getPaymentsSheetName();
  const dailySheetName = getDailyPaymentsSheetName();
  const weeklySheetName = getWeeklyPaymentsSheetName();
  const monthlySheetName = getMonthlyPaymentsSheetName();

  const { data: targetRows, error: targetError } = await auth.supabase
    .from("individual_savings_contributions")
    .select("amount, paid_at, paystack_reference, profiles:user_id(name, phone), goals:goal_id(name, frequency)")
    .eq("status", "success")
    .order("paid_at", { ascending: true })
    .limit(10000);

  const { data: generalRows, error: generalError } = await auth.supabase
    .from("savings_deposits")
    .select("amount, paid_at, reference, profiles:user_id(name, phone), schemes:scheme_id(name, frequency)")
    .eq("status", "success")
    .order("paid_at", { ascending: true })
    .limit(10000);

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 400 });
  }

  if (generalError) {
    return NextResponse.json({ error: generalError.message }, { status: 400 });
  }

  const byFrequency: Record<"daily" | "weekly" | "monthly", Array<(string | number | null)>> = {
    daily: [],
    weekly: [],
    monthly: [],
  };

  for (const row of targetRows ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const goal = Array.isArray(row.goals) ? row.goals[0] : row.goals;
    const frequency = goal?.frequency === "daily" || goal?.frequency === "weekly" || goal?.frequency === "monthly"
      ? goal.frequency
      : "monthly";

    byFrequency[frequency].push([
      row.paid_at ?? "",
      profile?.name ?? "",
      profile?.phone ?? "",
      goal?.name ?? "Target Savings",
      "Target",
      "Wallet",
      Number(row.amount ?? 0),
      "Successful",
      row.paystack_reference ?? "",
    ]);
  }

  for (const row of generalRows ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const scheme = Array.isArray(row.schemes) ? row.schemes[0] : row.schemes;
    const frequency = scheme?.frequency === "daily" || scheme?.frequency === "weekly" || scheme?.frequency === "monthly"
      ? scheme.frequency
      : "monthly";

    byFrequency[frequency].push([
      row.paid_at ?? "",
      profile?.name ?? "",
      profile?.phone ?? "",
      scheme?.name ?? "General Savings",
      "General",
      "Wallet",
      Number(row.amount ?? 0),
      "Successful",
      row.reference ?? "",
    ]);
  }

  const legacyRows = [
    ...byFrequency.daily,
    ...byFrequency.weekly,
    ...byFrequency.monthly,
  ].map((row) => {
    return [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8],
    ];
  });

  // Keep legacy "PaymentEvents" sheet working, but with clean non-technical columns.
  await clearAndSeedGoogleSheet({
    spreadsheetId,
    sheetName: legacySheetName,
    headers: PAYMENT_HEADERS,
  });

  if (legacyRows.length > 0) {
    await appendRowsToGoogleSheet({
      spreadsheetId,
      sheetName: legacySheetName,
      headers: PAYMENT_HEADERS,
      rows: legacyRows,
    });
  }

  const frequencySheets: Array<{ sheetName: string; rows: Array<(string | number | null)> }> = [
    { sheetName: dailySheetName, rows: byFrequency.daily },
    { sheetName: weeklySheetName, rows: byFrequency.weekly },
    { sheetName: monthlySheetName, rows: byFrequency.monthly },
  ];

  for (const entry of frequencySheets) {
    await clearAndSeedGoogleSheet({
      spreadsheetId,
      sheetName: entry.sheetName,
      headers: PAYMENT_HEADERS,
    });
    if (entry.rows.length > 0) {
      await appendRowsToGoogleSheet({
        spreadsheetId,
        sheetName: entry.sheetName,
        headers: PAYMENT_HEADERS,
        rows: entry.rows,
      });
    }
  }

  const syncedRows = byFrequency.daily.length + byFrequency.weekly.length + byFrequency.monthly.length;
  const sheetBreakdown = [
    { sheetName: dailySheetName, syncedRows: byFrequency.daily.length },
    { sheetName: weeklySheetName, syncedRows: byFrequency.weekly.length },
    { sheetName: monthlySheetName, syncedRows: byFrequency.monthly.length },
    { sheetName: legacySheetName, syncedRows: legacyRows.length },
  ];

  return NextResponse.json({
    data: {
      success: true,
      syncedRows,
      sheetBreakdown,
      mode: "full_refresh",
      autoSyncEnabled: process.env.GOOGLE_SHEETS_AUTO_SYNC === "true",
    },
  });
}
