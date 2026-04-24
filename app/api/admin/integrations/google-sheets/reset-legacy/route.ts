import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { clearAndSeedGoogleSheetIfExists } from "@/lib/google-sheets";

const MEMBER_EVENT_HEADERS = [
  "name",
  "email",
  "joined_at",
  "status_note",
];

const PAYMENT_EVENT_HEADERS = [
  "name",
  "paid_at",
  "amount",
  "currency",
  "status_note",
];

function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ?? "";
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

  const memberSheetCandidates = [
    process.env.GOOGLE_SHEETS_MEMBERS_SHEET_NAME?.trim(),
    "GroupMembers",
    "MemberEvents",
  ].filter((value): value is string => Boolean(value));

  const paymentSheetCandidates = [
    process.env.GOOGLE_SHEETS_PAYMENTS_SHEET_NAME?.trim(),
    "PaymentEvents",
  ].filter((value): value is string => Boolean(value));

  const cleared: Array<{ sheetName: string; headers: string[] }> = [];

  for (const sheetName of memberSheetCandidates) {
    const result = await clearAndSeedGoogleSheetIfExists({
      spreadsheetId,
      sheetName,
      headers: MEMBER_EVENT_HEADERS,
    });
    if (result.cleared) cleared.push({ sheetName, headers: MEMBER_EVENT_HEADERS });
  }

  for (const sheetName of paymentSheetCandidates) {
    const result = await clearAndSeedGoogleSheetIfExists({
      spreadsheetId,
      sheetName,
      headers: PAYMENT_EVENT_HEADERS,
    });
    if (result.cleared) cleared.push({ sheetName, headers: PAYMENT_EVENT_HEADERS });
  }

  return NextResponse.json({
    data: {
      success: true,
      cleared,
    },
  });
}
