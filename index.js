const express = require("express");
const { google } = require("googleapis");
const app = express();
const format = require("date-format");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const logModel = require("./models/log.model.js");

dotenv.config();

app.use(express.json());
async function appendToSheet(data, sheet = "") {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "11d5Iojvl_5NeFdrdmsQkC0N33_6CmiAI8xWJ7hGAUOI";
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
}

app.get("/", (req, res) => {
  res.send("hello");
});

const saveLog = async (logData) => {
  const log = await new logModel({ strLog: JSON.stringify(logData) });
  log.save();
  console.log("Логи сохранены");
};

app.post("/log", async (req, res) => {
  try {
    await saveLog(req.body);
    console.log("Логи сохранены");
    res.send(200).status(200);
  } catch (err) {
    if (err) console.log(err);
  }
});

const pendingData = new Map();

const sendLogToChat = async (token, chat_id, description, data) => {
  await fetch(
    `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${JSON.stringify(
      {
        description,
        ...data,
      }
    )}
    `,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }
  );
};

app.get("/save-hash", (req, res) => {
  try {
    const { advertisment, geo, sessionId } = req.query;
    pendingData.set(sessionId, { addSet: advertisment, geo });
    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002534133157",
      "/save-hash Сохранить в хеш таблицу при клице на ВЦ",
      {
        advertisment,
        geo,
        sessionId,
        pendingData: Array.from(pendingData),
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Ошибка в маршруте:", err);
    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002688284609",
      "/save-hash Сохранить в хеш таблицу при клице на ВЦ",
      {
        err,
        message: err.message,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );
    res.status(500).send("❌ Ошибка при записи");
  }
});

app.get("/compare-data/:phone/:sessionId/:name", async (req, res) => {
  try {
    console.log(req.params);
    const { phone, sessionId, name } = req.params;

    const session = sessionId;
    const record = [];
    const data = pendingData.get(session);

    if (!data) {
      sendLogToChat(
        process.env.BOT_LOG_TOKEN,
        "-1002534133157",
        `/compare-data не отправил стартовое сообщение utm - неизвестен`,
        {
          phone,
          sessionId,
          name,
          data,
          time: format("dd-MM-yyyy, hh:mm"),
        }
      );
      
      record.push(
        "WhatsApp",
        name ? name : "-",
        phone,
        "-",
        "-",
        format("dd-MM-yyyy, hh:mm")
      );
      await appendToSheet(record);
      return res.status(200).send("ok");
    }

    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002534133157",
      `/compare-data сравнинеие и запись хеша, при отправке старт в ВЦ`,
      {
        phone,
        sessionId,
        name,
        data,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );

    record.push(
      "WhatsApp",
      name ? name : "-",
      phone,
      data.addSet === undefined || data.addSet === null ? "-" : data.addSet,
      data.geo === undefined || data.geo === null ? "-" : data.geo,
      format("dd-MM-yyyy, hh:mm")
    );

    await appendToSheet(record);
    pendingData.delete(session);
    res.status(200).send("ok");
  } catch (err) {
    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002688284609",
      "/compare-data сравнинеие и запись хеша, при отправке старт в ВЦ",
      {
        err,
        message: err.message,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );
    console.error("❌ Ошибка в маршруте:", err);
    res.status(500).send("❌ Ошибка при записи");
  }
});

app.get("/record", async (req, res) => {
  try {
    const { username, fullname, userId, payload, sheet } = req.query;
    console.log("🔹 Запрос получен:", JSON.stringify(req.query));

    const [advertisment, geo] = payload.split("-");
    const recordData = [];

    await saveLog({
      query: req.query,
      payload,
    });

    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002534133157",
      "/record запись в таблицу с тг бота",
      {
        username,
        fullname,
        userId,
        payload,
        sheet,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );
    recordData.push(
      username,
      fullname,
      userId,
      advertisment,
      geo,
      format("dd-MM-yyyy, hh:mm")
    );

    appendToSheet(recordData, sheet);
    res.status(200).send("✅ Записано в таблицу");
  } catch (err) {
    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002688284609",
      "/record запись в таблицу с тг бота",
      {
        err,
        message: err.message,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );
    console.error("❌ Ошибка в маршруте:", err);
    res.status(500).send("❌ Ошибка при записи");
  }
});
mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
