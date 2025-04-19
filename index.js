const express = require('express');
const { google } = require('googleapis');
const app = express();
const format = require('date-format');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const logModel = require('./models/log.model.js');

dotenv.config();

app.use(express.json());
async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1Fsknq-JhWjUy7RH6bTVPkdcXFbFldIZz2zbyesS6wc8';
  const range = 'leads!A:A';

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

app.get('/', (req, res) => {
  res.send('hello');
});

const saveLog = async (logData) => {
  const log = await new logModel({ strLog: JSON.stringify(logData) });
  log.save();
  console.log('Логи сохранены');
};

app.post('/log', async (req, res) => {
  try {
    await saveLog(req.body);
    console.log('Логи сохранены');
    res.send(200).status(200);
  } catch (err) {
    if (err) console.log(err);
  }
});

app.get('/record', async (req, res) => {
  try {
    const { username, fullname, userId, payload } = req.query;
    console.log('🔹 Запрос получен:', JSON.stringify(req.query));

    // const decodedPayload = base64ToString(payload);
    const [ip, advertisment, geo] = payload.split('-');
    const recordData = [];
    
    await saveLog({
      query: req.query,
      payload,
    });

    recordData.push(
      username,
      fullname,
      userId,
      advertisment,
      ip,
      geo,
      format('dd-MM-yyyy, hh:mm')
    );

    appendToSheet(recordData);
    res.status(200).send('✅ Записано в таблицу');
  } catch (err) {
    console.error('❌ Ошибка в маршруте:', err);
    res.status(500).send('❌ Ошибка при записи');
  }
});
mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));