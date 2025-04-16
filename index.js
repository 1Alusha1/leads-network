const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: process.env.GOOGLE_CRED,
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
      values: [data],
    },
  });

  console.log('✅ Данные успешно добавлены!');
}

function base64ToString(base64) {
  return decodeURIComponent(escape(atob(base64)));
}

app.get('/record', async (req, res) => {
  try {
    const { username, fullname, userId, payload, time } = req.query;
    console.log('🔹 Запрос получен:', JSON.stringify(req.query));

    // EllisTech Antonio Тех 8119682966 213.111.64.252&хуй&55551331 1744124873
    // const username = 'EllisTech';
    // const fullname = 'Antonio Тех';
    // const userId = 8119682966;
    // const payload = 'MjEzLjExMS42NC4yNTIm0YXRg9C5JjU1NTUxMzMx';
    // const time = 1744815691;
    const decodedPayload = base64ToString(payload);
    const [ip, advertisment, pixel] = decodedPayload.split('&');
    const recordData = [];

    recordData.push(
      username,
      fullname,
      userId,
      advertisment,
      pixel,
      ip,
      '',
      time
    );

    console.log(recordData);

    appendToSheet(recordData);
    res.status(200).send('✅ Записано в таблицу');
  } catch (err) {
    console.error('❌ Ошибка в маршруте:', err);
    res.status(500).send('❌ Ошибка при записи');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
