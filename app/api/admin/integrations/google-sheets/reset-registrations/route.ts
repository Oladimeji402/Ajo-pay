import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { clearAndSeedGoogleSheet } from "@/lib/google-sheets";

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
  await clearAndSeedGoogleSheet({
    spreadsheetId,
    sheetName,
    headers: REGISTRATION_HEADERS,
  });

  return NextResponse.json({
    data: {
      success: true,
      sheetName,
      cleared: true,
      headers: REGISTRATION_HEADERS,
    },
  });
}
