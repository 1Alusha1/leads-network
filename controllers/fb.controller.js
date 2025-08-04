import dotenv from "dotenv";
import { fbLeadsTarget } from "../utils/parseLead.js";
import userModel from "../models/user.model.js";
import leadFormTemplateModel from "../models/leadFormTemplate.model.js";
import appendToSheet from "../utils/appendToSheet.js";
dotenv.config();

export const validationHook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === process.env.FB_HOOK_TOKEN) {
    console.log("✅ Webhook подтвержден");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

export const sendDataToCRM = async (req, res) => {
  const { entry } = req.body;

  for (const lead of entry) {
    const formId = lead.changes[0].value.form_id;

    const template = await leadFormTemplateModel.findOne({ formId });
    const user = await userModel.findOne({
      "connectedForm.formId": formId,
    });

    if (!template) {
      console.log(`⛔ Форма ${formId} не подключена`);
      continue; // не прерываем — просто пропускаем
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${lead.changes[0].value.leadgen_id}?access_token=${user?.fb_token}`
    );

    const data = await response.json();

    console.log(data);

    if (data.error) {
      console.error("❌ Ошибка при получении лида:", data.error);
      continue;
    }

    if (template.type === "GOOGLESheets") {
      const validLead = fbLeadsTarget(data);
      const valuesArray = Object.values(validLead);
      console.log(validLead);
      valuesArray.push(template.adset);

      await appendToSheet(valuesArray, template.sheet, template.tableId);
      console.log("✅ Лид отправлен:", valuesArray);
    }
  }

  // ВАЖНО: Facebook ждет только 200 OK. Ответ один на все entry
  return res.sendStatus(200);
};

export const getLongLivedToken = async (req, res) => {
  const { fb_token, authToken } = req.body;

  try {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.APP_ID,
      client_secret: process.env.FB_CLIENT_SECRET,
      fb_exchange_token: fb_token,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params}`
    );

    const data = await response.json();

    if (data.error) {
      return res
        .status(400)
        .json({ message: data.error.message, type: "error" });
    }

    if (data.access_token) {
      await userModel.findOneAndUpdate(
        { authToken },
        { fb_token: data.access_token },
        { new: true }
      );
    }

    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};

export const saveLeadFormTemplate = async (req, res) => {
  const { formId, userId } = req.body;

  try {
    const template = await leadFormTemplateModel.findOne({ formId });

    if (template) {
      return res
        .status(400)
        .json({ message: "Форма уже подключнеа", type: "error" });
    }

    await leadFormTemplateModel({ ...req.body }).save();

    await userModel.updateOne(
      { _id: userId },
      { $push: { connectedForm: { ...req.body } } }
    );

    return res
      .status(200)
      .json({ message: "Шаблон формы сохранен", type: "success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};
