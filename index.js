const express = require('express');
const { google } = require('googleapis');
const app = express();
const format = require('date-format');
const dotenv = require('dotenv');
dotenv.config();

async function appendToSheet(data) {}

function base64ToString(base64) {
  return decodeURIComponent(escape(atob(base64)));
}

app.get('/', (req, res) => {
  res.send('hello');
});

app.get('/record', async (req, res) => {
  try {
    const { username, fullname, userId, payload } = req.query;
    console.log('🔹 Запрос получен:', JSON.stringify(req.query));

    const decodedPayload = base64ToString(payload);
    const [ip, advertisment, pixel, geo] = decodedPayload.split('&');

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CRED),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = '1Fsknq-JhWjUy7RH6bTVPkdcXFbFldIZz2zbyesS6wc8';
    const range = 'leads';

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          username,
          fullname,
          userId,
          advertisment,
          pixel,
          ip,
          geo,
          format('dd-MM-yyyy, hh:mm'),
        ],
      },
    });

    res.status(200).send('✅ Записано в таблицу');
  } catch (err) {
    console.error('❌ Ошибка в маршруте:', err);
    res.status(500).send('❌ Ошибка при записи');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
