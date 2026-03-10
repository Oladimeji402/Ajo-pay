# Ajopay Digital Ajo Savings

This repository is now a single Next.js app from the root directory.

## Run Locally

Prerequisite: Node.js 20+

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`

Open [http://localhost:3001](http://localhost:3001).

## Google Sheets Export (Admin)

This project includes an admin-only API route to export a group snapshot to Google Sheets:

`POST /api/admin/integrations/google-sheets/export-group`

### 1. Create a Google Service Account

1. Open Google Cloud Console and create/select a project.
2. Enable the Google Sheets API.
3. Create a Service Account and generate a JSON key.
4. Share your target Google Sheet with the service account email (Editor access).

### 2. Add Environment Variables

Use one of these approaches:

- Preferred (single variable):

`GOOGLE_SERVICE_ACCOUNT_JSON={...full JSON key...}`

- Or split values:

`GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com`

`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`

Optional (recommended):

`GOOGLE_SHEETS_SPREADSHEET_ID=<default-spreadsheet-id>`

Optional auto-sync on key events:

`GOOGLE_SHEETS_AUTO_SYNC=true`

`GOOGLE_SHEETS_MEMBERS_SHEET_NAME=MemberEvents`

`GOOGLE_SHEETS_PAYMENTS_SHEET_NAME=PaymentEvents`

### 3. Call the Export Endpoint

Request body:

```json
{
   "groupId": "<group-uuid>",
   "spreadsheetId": "<google-spreadsheet-id>",
   "sheetName": "GroupMembers"
}
```

Notes:

- Route requires an authenticated admin session.
- `spreadsheetId` can be omitted in body if `GOOGLE_SHEETS_SPREADSHEET_ID` is set.
- Header row is created automatically if the sheet tab is empty.
- Each request appends the current group snapshot as new rows.
- Auto-sync appends events when a member joins a group and when a contribution payment succeeds.
