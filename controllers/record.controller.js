import hashModel from "../models/hash.model.js";
import tgUserModel from "../models/tguser.model.js";
import waUserModel from "../models/wauser.model.js";
import appendToSheet from "../utils/appendToSheet.js";
import notificationSender from "../utils/notificationSender.js";
import sendLogToChat from "../utils/sendLogToChat.js";
import dotenv from "dotenv";
const format = (await import("date-format")).default;

dotenv.config();

export const saveHash = async (req, res) => {
  try {
    const { advertisment, geo, sessionId, sheet, tableId, chatId } = req.query;

    console.log(req.query);

    // тут сохраняем в бд, что бы сессии не терялись
    await new hashModel({
      sessionId,
      addSet: advertisment,
      geo,
      sheet,
      tableId,
      chatId: chatId ? chatId : " ",
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
};

export const compareData = async (req, res) => {
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
      await appendToSheet(
        record,
        "leads",
        "11d5Iojvl_5NeFdrdmsQkC0N33_6CmiAI8xWJ7hGAUOI"
      );
      return res.status(200).send("ok");
    }

    console.log(hash);

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

    record.push(
      "WhatsApp",
      name ? name : "-",
      phone,
      hash.addSet === undefined || hash.addSet === null ? "-" : hash.addSet,
      hash.geo === undefined || hash.geo === null ? "-" : hash.geo,
      format("dd-MM-yyyy, hh:mm")
    );

    // отправить сообщение о новом лиде, конкретному человеку
    notificationSender(
      process.env.BOT_LOG_TOKEN,
      `WhatsApp: упал лид, номер: ${phone}`,
      hash.chatId ? hash.chatId : ""
    );

    await appendToSheet(record, hash.sheet, hash.tableId);
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
};

export const record = async (req, res) => {
  try {
    const { username, fullname, userId, payload, sheet, tableId, chatId } =
      req.query;
    console.log("🔹 Запрос получен:", JSON.stringify(req.query));

    // // Проверяем есть ли запись в бд
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
    if (chatId) {
      notificationSender(
        process.env.BOT_LOG_TOKEN,
        `Telegram: упал лид \n Имя пользователя: @${username} \n Полное имя: ${fullname} \n Id: ${userId} \n Гео: ${geo}`,
        chatId
      );
    }

    recordData.push(
      username,
      fullname,
      userId,
      advertisment,
      geo,
      format("dd-MM-yyyy, hh:mm")
    );

    appendToSheet(recordData, sheet, tableId);
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
};
