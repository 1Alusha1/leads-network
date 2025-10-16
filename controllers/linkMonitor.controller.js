import { config } from 'dotenv';
import userModel from '../models/user.model.js';
import { sendTelegram } from '../index.js';
import linkMonitorModel from '../models/linkMonitor.model.js';
config();

function generateToken(length = 12) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * chars.length);
    token += chars[randIndex];
  }
  return token;
}

export const createLink = async (req, res) => {
  const { userId } = req.body;
  const token = generateToken(6);

  const botUsername = 'linksmooonitorbot';
  const url = `https://t.me/${botUsername}?start=${encodeURIComponent(
    token
  )}-${encodeURIComponent(userId)}`;

  const BOT_TOKEN = process.env.LINK_MONITOR_BOT; // токен бота
  const webhookUrl = process.env.TG_WEBOOK_URL; // публичный URL

  try {
    const webhookSetup = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: token,
        }),
      }
    );
    const webhookRes = await webhookSetup.json();
    console.log('Webhook setup:', webhookRes);
  } catch (err) {
    console.error('Webhook setup failed:', err);
  }

  res.json({ token, url });
};

export const tgWebHook = async (req, res) => {
  const update = req.body;
  const msg =
    update.message || update.edited_message || update.callback_query?.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat?.id || msg.from?.id;
  const text = msg.text || '';

  if (text.startsWith('/start')) {
    const payload = text.split(' ')[1];
    if (payload) {
      const [_, userId] = payload.split('-');

      const user = await userModel.findOneAndUpdate(
        { _id: userId },
        { chat_id: chatId },
        { new: true }
      );

      if (user) {
        const BOT_TOKEN = process.env.LINK_MONITOR_BOT;

        sendTelegram(BOT_TOKEN, chatId, 'Вы успешно подключены!');
      }
    }
  }

  res.sendStatus(200);
};

export const getLinks = async (req, res) => {
  const { chat_id } = req.body;
  try {
    if (!chat_id) {
      return res.status(400).json({
        message: 'Пользователь не подключен к боту',
        error: null,
        type: 'error',
      });
    }

    const links = await linkMonitorModel.find({ chat_id });

    return res.status(200).json({
      links,
      message: 'Данные пользователя получены!',
      type: 'success',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Ошибка во время авторизации',
      error: err.message,
      type: 'error',
    });
  }
};

export const addLink = async (req, res) => {
  const { chat_id, link } = req.body;
  try {
    if (!chat_id || !link) {
      return res.status(400).json({
        message: 'Переданы не все поля',
        type: 'warning',
        error: null,
      });
    }

    const newlink = await new linkMonitorModel({
      chat_id,
      link,
    });

    await newlink.save();

    return res.status(200).json({
      error: null,
      message: 'Ссылка успешно добаленна',
      type: 'success',
      newlink,
    });
  } catch (err) {}
};

export const deleteLink = async (req, res) => {
  const { _id } = req.body;
  try {
    if (!_id) {
      return res.status(400).json({
        message: 'Не передан идентификатор ссылки',
        error: null,
        type: 'error',
      });
    }

    await linkMonitorModel.findOneAndDelete({ _id });

    return res.status(200).json({
      type: 'success',
      message: 'Ссылка удалена',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Ошибка во время авторизации',
      error: err.message,
      type: 'error',
    });
  }
};
