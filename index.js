const express = require('express');
const { google } = require('googleapis');
const app = express();
const format = require('date-format');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const logModel = require('./models/log.model.js');

app.use(express.json());

// Очередь для запросов
let queue = [];

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

const SPREADSHEET_ID = '1Fsknq-JhWjUy7RH6bTVPkdcXFbFldIZz2zbyesS6wc8';
const SHEET_RANGE = 'leads!A:F';

async function appendToSheet(data) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'leads!A:A',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [data],
    },
  });
  console.log('✅ Данные успешно добавлены!');
}

// Сохраняем лог в MongoDB
const saveLog = async (logData) => {
  console.log(logData, format('dd-MM-yyyy, hh:mm'));
  const log = await new logModel({ strLog: JSON.stringify(logData) });
  log.save();
  console.log('Логи сохранены');
};

// Обновление последней строки с payload
async function updateLastRowWithPayload(advertisment, geo) {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = res.data.values || [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (!row[3] && !row[4]) {
      const rowIndex = i + 1; // Google Sheets — 1-based index
      const updateRange = `leads!D${rowIndex}:E${rowIndex}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[advertisment, geo]],
        },
      });
      console.log(`✏️ Payload добавлен в строку ${rowIndex}`);
      return;
    }
  }

  console.warn('⚠️ Не удалось найти строку для обновления');
}

// Функция для обработки очереди
async function processQueue() {
  if (queue.length > 0) {
    const { username, fullname, userId, payload, timestamp } = queue.shift();
    const [advertisment, geo] = (payload || '').split('-');

    const sheets = await getSheetsClient();
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = getRes.data.values || [];
    const lastRow = rows[rows.length - 1] || [];
    const rowIndex = rows.length;

    // Заполним поля для обновления
    const newRow = [
      lastRow[0] || username || '', // username
      lastRow[1] || fullname || '', // fullname
      lastRow[2] || userId || '', // userId
      lastRow[3] || advertisment || '', // ad
      lastRow[4] || geo || '', // geo
      lastRow[5] || timestamp || '', // timestamp
    ];

    const isRowEmpty = lastRow.every((cell) => !cell);
    const isRowIncomplete = newRow.some((v, i) => !lastRow[i] && v);

    if (isRowEmpty || !isRowIncomplete) {
      // либо таблица пустая, либо последняя строка уже заполнена — добавляем новую
      await appendToSheet([
        username || '',
        fullname || '',
        userId || '',
        advertisment || '',
        geo || '',
        timestamp,
      ]);
      console.log('📥 Добавлена новая строка');
    } else {
      // обновляем последнюю строку
      const updateRange = `leads!A${rowIndex}:F${rowIndex}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [newRow],
        },
      });
      console.log(`✏️ Обновлена строка ${rowIndex}`);
    }
    // После обработки запускаем следующий запрос в очереди
    processQueue();
  }
}

// Маршрут для получения данных
app.get('/record', async (req, res) => {
  try {
    const { username, fullname, userId, payload } = req.query;
    const timestamp = format('dd-MM-yyyy, hh:mm');

    // Добавляем запрос в очередь
    queue.push({ username, fullname, userId, payload, timestamp });

    console.log(`🔹 Запрос добавлен в очередь: ${JSON.stringify(req.query)}`);

    // Сохраняем лог
    await saveLog({ query: req.query, timestamp });

    // Если очередь не пуста, начинаем обработку
    if (queue.length === 1) {
      processQueue();
    }

    res.status(200).send('✅ Запрос принят и добавлен в очередь');
  } catch (err) {
    console.error('❌ Ошибка в /record:', err);
    res.status(500).send('❌ Ошибка');
  }
});

mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
