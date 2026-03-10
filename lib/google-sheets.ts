import { google } from "googleapis";

export type GoogleSheetRow = Array<string | number | null>;

type GoogleCredentials = {
  clientEmail: string;
  privateKey: string;
};

function getGoogleCredentials(): GoogleCredentials {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const envClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const envPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        };
      }
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  if (!envClientEmail || !envPrivateKey) {
    throw new Error(
      "Missing Google service account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  return {
    clientEmail: envClientEmail,
    privateKey: envPrivateKey.replace(/\\n/g, "\n"),
  };
}

async function getSheetsClient() {
  const credentials = getGoogleCredentials();

  const auth = new google.auth.JWT({
    email: credentials.clientEmail,
    key: credentials.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function ensureSheetExists(spreadsheetId: string, sheetName: string) {
  const sheets = await getSheetsClient();
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });

  const existingTitles = new Set(
    (metadata.data.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  );

  if (existingTitles.has(sheetName)) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });
}

async function ensureHeaderRow(
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
) {
  await ensureSheetExists(spreadsheetId, sheetName);

  const sheets = await getSheetsClient();
  const range = `${sheetName}!1:1`;

  const existingHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });

  const current = existingHeader.data.values?.[0] ?? [];

  if (current.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }
}

export async function appendRowsToGoogleSheet(params: {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  rows: GoogleSheetRow[];
}) {
  const { spreadsheetId, sheetName, headers, rows } = params;

  if (rows.length === 0) {
    return { appendedRows: 0 };
  }

  await ensureHeaderRow(spreadsheetId, sheetName, headers);

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  return { appendedRows: rows.length };
}

export async function replaceGroupRowsInGoogleSheet(params: {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  groupId: string;
  rows: GoogleSheetRow[];
  groupIdColumnHeader?: string;
}) {
  const {
    spreadsheetId,
    sheetName,
    headers,
    groupId,
    rows,
    groupIdColumnHeader = "group_id",
  } = params;

  await ensureSheetExists(spreadsheetId, sheetName);

  const sheets = await getSheetsClient();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
    majorDimension: "ROWS",
  });

  const existingValues = existing.data.values ?? [];
  const headerRow = (existingValues[0] ?? headers).map((value) => String(value));

  let groupColumnIndex = headerRow.findIndex((value) => value === groupIdColumnHeader);
  if (groupColumnIndex < 0) {
    groupColumnIndex = headers.findIndex((value) => value === groupIdColumnHeader);
  }

  const existingBodyRows = existingValues.slice(1);
  const preservedRows =
    groupColumnIndex >= 0
      ? existingBodyRows.filter((row) => String(row[groupColumnIndex] ?? "") !== groupId)
      : existingBodyRows;

  const output = [headers, ...preservedRows, ...rows];

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: output,
    },
  });

  return {
    replacedRows: rows.length,
    preservedRows: preservedRows.length,
  };
}