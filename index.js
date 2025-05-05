const express = require("express");
const { google } = require("googleapis");
const app = express();
const format = require("date-format");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const logModel = require("./models/log.model.js");
const hashModel = require("./models/hash.model.js");
const waUserModel = require("./models/wauser.model.js");
const tgUserModel = require("./models/tguser.model.js");
const notificatonSender = require("./utils/notificatonSender.js");
const sendLogToChat = require("./utils/sendLogToChat.js");


app.use(express.json());


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


app.get("/save-hash", async (req, res) => {
  try {
    const { advertisment, geo, sessionId } = req.query;

    // тут сохраняем в бд, что бы сессии не терялись
    await new hashModel({
      sessionId,
      addSet: advertisment,
      geo,
    }).save();

    sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002534133157",
      "/save-hash Сохранить в хеш таблицу при клице на ВЦ",
      {
        advertisment,
        geo,
        sessionId,
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

app.get("/compare-data", async (req, res) => {
  try {
    console.log(req.query);
    const { phone, sessionId, name } = req.query;

    // тут проверяем есть ли такой тип в бд;
    const wauser = await waUserModel.findOne({ phone });
    if (wauser) {
      sendLogToChat(
        process.env.BOT_LOG_TOKEN,
        "-1002534133157",
        `/compare-data WhatsApp Дубль. не записан в таблицу`,
        {
          phone,
          sessionId,
          name,
          time: format("dd-MM-yyyy, hh:mm"),
        }
      );
      return res.status(200).send("ok");
    }

    const record = [];

    // проверяем существует ли хеш
    const hash = await hashModel.findOne({ sessionId });

    // сохраняем юзера, если он не дубль и есть хэш
    await new waUserModel({
      phone,
      name,
      geo: hash ? hash.geo : "",
    }).save();

    if (!hash) {
      sendLogToChat(
        process.env.BOT_LOG_TOKEN,
        "-1002534133157",
        `/compare-data не отправил стартовое сообщение utm - неизвестен`,
        {
          phone,
          sessionId,
          name,
          hash,
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
      `/compare-data Пользователь записан`,
      {
        phone,
        sessionId,
        name,
        hash,
        time: format("dd-MM-yyyy, hh:mm"),
      }
    );

    // отправить сообщение о новом лиде, конкретному человеку
    notificatonSender(process.env.BOT_LOG_TOKEN,hash.addSet, "WhatsApp: упал лид, смотри в листе Leads");

    record.push(
      "WhatsApp",
      name ? name : "-",
      phone,
      hash.addSet === undefined || hash.addSet === null ? "-" : hash.addSet,
      hash.geo === undefined || hash.geo === null ? "-" : hash.geo,
      format("dd-MM-yyyy, hh:mm")
    );

    await appendToSheet(record);
    await hashModel.findOneAndDelete({sessionId})
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

    // Проверяем есть ли запись в бд
    const tguser = await tgUserModel.findOne({ userId });
    if (tguser) {
      sendLogToChat(
        process.env.BOT_LOG_TOKEN,
        "-1002534133157",
        "/record Telegram Дубль. не записан в таблицу",
        {
          username,
          fullname,
          userId,
          payload,
          sheet,
          time: format("dd-MM-yyyy, hh:mm"),
        }
      );
      return res.status(200).send("Не записан в таблицу");
    }

    // если нет в бд, записываем в таблицу как нового юзера
    const [advertisment, geo] = payload.split("-");
    const recordData = [];

    await tgUserModel({
      username,
      userId,
      geo,
    }).save();

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
    // отправить сообщение о новом лиде, конкретному человеку
    notificatonSender(
      process.env.BOT_LOG_TOKEN,
      advertisment,
      "Telegram: упал лид, смотри в листе aff"
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
      "/record Ошибка записи в таблицу с тг бота",
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
