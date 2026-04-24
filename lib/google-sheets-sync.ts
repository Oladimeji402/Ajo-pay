import { appendRowsToGoogleSheet, upsertRowInGoogleSheet } from "@/lib/google-sheets";

function isAutoSyncEnabled() {
  return process.env.GOOGLE_SHEETS_AUTO_SYNC === "true";
}

function getDefaultSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  return spreadsheetId ? spreadsheetId.trim() : "";
}

export function canUseGoogleSheetsAutoSync() {
  return isAutoSyncEnabled() && Boolean(getDefaultSpreadsheetId());
}

export async function appendGroupMemberJoinToGoogleSheet(params: {
  groupId: string;
  groupName: string;
  groupCategory: string;
  userId: string;
  userName: string;
  userEmail: string;
  position: number;
  joinedAt: string;
}) {
  if (!canUseGoogleSheetsAutoSync()) return;

  const spreadsheetId = getDefaultSpreadsheetId();
  await appendRowsToGoogleSheet({
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_MEMBERS_SHEET_NAME?.trim() || "MemberEvents",
    headers: [
      "event",
      "joined_at",
      "group_id",
      "group_name",
      "group_category",
      "user_id",
      "user_name",
      "user_email",
      "position",
    ],
    rows: [
      [
        "member_joined",
        params.joinedAt,
        params.groupId,
        params.groupName,
        params.groupCategory,
        params.userId,
        params.userName,
        params.userEmail,
        params.position,
      ],
    ],
  });
}

export async function appendContributionPaymentToGoogleSheet(params: {
  reference: string;
  paidAt: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  amount: number;
  channel: string;
  providerReference: string;
}) {
  if (!canUseGoogleSheetsAutoSync()) return;

  const spreadsheetId = getDefaultSpreadsheetId();
  await appendRowsToGoogleSheet({
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_PAYMENTS_SHEET_NAME?.trim() || "PaymentEvents",
    headers: [
      "event",
      "paid_at",
      "reference",
      "provider_reference",
      "channel",
      "user_id",
      "user_name",
      "group_id",
      "group_name",
      "amount",
      "currency",
    ],
    rows: [
      [
        "contribution_paid",
        params.paidAt,
        params.reference,
        params.providerReference,
        params.channel,
        params.userId,
        params.userName,
        params.groupId,
        params.groupName,
        params.amount,
        "NGN",
      ],
    ],
  });
}

export async function appendUserRegistrationToGoogleSheet(params: {
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  registeredAt: string;
}) {
  if (!canUseGoogleSheetsAutoSync()) return;

  const spreadsheetId = getDefaultSpreadsheetId();
  await upsertRowInGoogleSheet({
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_REGISTRATIONS_SHEET_NAME?.trim() || "Registrations",
    headers: [
      "full_name",
      "email",
      "phone",
      "registered_at",
    ],
    keyHeader: "email",
    keyValue: params.email,
    row: [
      params.fullName,
      params.email,
      params.phone ?? "",
      params.registeredAt,
    ],
  });
}

const FRIENDLY_PAYMENT_HEADERS = [
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

export async function upsertSavingsPaymentToGoogleSheet(params: {
  paidAt: string;
  customerName: string;
  phone?: string | null;
  planName: string;
  planType: "Target" | "General";
  frequency: "daily" | "weekly" | "monthly";
  channel?: string | null;
  amount: number;
  status?: string;
  reference: string;
}) {
  if (!canUseGoogleSheetsAutoSync()) return;

  const spreadsheetId = getDefaultSpreadsheetId();
  const row = [
    params.paidAt,
    params.customerName,
    params.phone ?? "",
    params.planName,
    params.planType,
    params.channel ?? "Wallet",
    Number(params.amount ?? 0),
    params.status ?? "Successful",
    params.reference,
  ] as Array<string | number>;

  const frequencySheetName = params.frequency === "daily"
    ? (process.env.GOOGLE_SHEETS_DAILY_PAYMENTS_SHEET_NAME?.trim() || "DailyPayments")
    : params.frequency === "weekly"
      ? (process.env.GOOGLE_SHEETS_WEEKLY_PAYMENTS_SHEET_NAME?.trim() || "WeeklyPayments")
      : (process.env.GOOGLE_SHEETS_MONTHLY_PAYMENTS_SHEET_NAME?.trim() || "MonthlyPayments");

  await Promise.all([
    upsertRowInGoogleSheet({
      spreadsheetId,
      sheetName: frequencySheetName,
      headers: FRIENDLY_PAYMENT_HEADERS,
      keyHeader: "Reference",
      keyValue: params.reference,
      row,
    }),
    upsertRowInGoogleSheet({
      spreadsheetId,
      sheetName: process.env.GOOGLE_SHEETS_PAYMENTS_SHEET_NAME?.trim() || "PaymentEvents",
      headers: FRIENDLY_PAYMENT_HEADERS,
      keyHeader: "Reference",
      keyValue: params.reference,
      row,
    }),
  ]);
}