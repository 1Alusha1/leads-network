import { google } from "googleapis";

export default async (data, sheet, tableId) => {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 11d5Iojvl_5NeFdrdmsQkC0N33_6CmiAI8xWJ7hGAUOI
  const spreadsheetId = tableId;
  const range = !sheet ? "leads!A:F" : `${sheet}!A:F`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  });

  console.log("✅ Данные успешно добавлены!");
};
