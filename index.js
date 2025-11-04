import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import recordRoute from "./routes/record.route.js";
import fbRoute from "./routes/fb.route.js";
import ttRoute from "./routes/tt.route.js";
import ktRoute from "./routes/kt.route.js";
import userRoute from "./routes/user.route.js";
import formTemplate from "./routes/formTemplate.route.js";
import btqFinance from "./routes/btqFinance.route.js";
import duplicateLeads from "./routes/duplicateLeads.route.js";
import antiFraud from "./routes/antiFraud.route.js";
import linkMonitor from "./routes/linkmonitor.route.js";

import fileUpload from "express-fileupload";
import cors from "cors";
import { startCron } from "./cron/links.js";
import { createNotionPage } from "./controllers/notion.controller.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.use("/", recordRoute);
app.use("/fb", fbRoute);
app.use("/tt", ttRoute);
app.use("/kt", ktRoute);
app.use("/user", userRoute);
app.use("/template", formTemplate);
app.use("/btqFinance", btqFinance);
app.use("/duplicateLeads", duplicateLeads);
app.use("/antiFraud", antiFraud);
app.use("/link-monitor", linkMonitor);

export async function sendTelegram(token, chat_id, text) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text,
        }),
      }
    );

    const data = await response.json();

    return data;
  } catch (err) {
    console.log("Ошибка при отправке сообщения в телеграм");
  }
}

app.post("/sendTelegram", async (req, res) => {
  try {
    const { token, chat_id, text } = req.body;

    if (!token || !chat_id || !text) {
      return res.status(400).json({
        success: false,
        error: "token, chat_id и message обязательны",
      });
    }

    const data = await sendTelegram(token, chat_id, text);

    res.json({ success: true, telegram: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", async (req, res) => {
  await createNotionPage();
  res.send("hello");
});

startCron();

mongoose
  .connect(process.env.MOGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
