import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { appendRowsToGoogleSheet, clearAndSeedGoogleSheet } from "@/lib/google-sheets";

const REGISTRATION_HEADERS = [
  "full_name",
  "email",
  "phone",
  "registered_at",
];

function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ?? "";
}

function getRegistrationsSheetName() {
  return process.env.GOOGLE_SHEETS_REGISTRATIONS_SHEET_NAME?.trim() || "Registrations";
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

  const sheetName = getRegistrationsSheetName();

  const { data: profiles, error } = await auth.supabase
    .from("profiles")
    .select("name, email, phone, created_at")
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (profiles ?? []).map((profile) => [
    profile.name ?? "",
    profile.email ?? "",
    profile.phone ?? "",
    profile.created_at ?? "",
  ]);

  await clearAndSeedGoogleSheet({
    spreadsheetId,
    sheetName,
    headers: REGISTRATION_HEADERS,
  });

  if (rows.length > 0) {
    await appendRowsToGoogleSheet({
      spreadsheetId,
      sheetName,
      headers: REGISTRATION_HEADERS,
      rows,
    });
  }

  return NextResponse.json({
    data: {
      success: true,
      sheetName,
      syncedRows: rows.length,
      mode: "full_refresh",
      autoSyncEnabled: process.env.GOOGLE_SHEETS_AUTO_SYNC === "true",
    },
  });
}
