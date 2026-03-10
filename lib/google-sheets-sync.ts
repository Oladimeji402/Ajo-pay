import { appendRowsToGoogleSheet } from "@/lib/google-sheets";

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