import cron from 'node-cron';
import linkMonitorModel from '../models/linkMonitor.model.js';
import { sendTelegram } from '../index.js';
import { config } from 'dotenv';
config();

export const startCron = () => {
  console.log('Крон запущен 🚀');
  cron.schedule('*/20 * * * *', () => {
    console.log('Проверка доменов каждые 20 минут 🚀');
    chekLinks();
  });
};

const chekLinks = async () => {
  try {
    const links = await linkMonitorModel.find();

    if (!links.length) {
      return console.log('Нет ссылок для проверки');
    }

    links.forEach(async ({ link, chat_id }) => {
      try {
        const res = await fetch(link);
        const status = await res.status;

        if (status !== 200) {
          sendTelegram(
            process.env.LINK_MONITOR_BOT,
            chat_id,
            `Ошибка при проверке.\nСсылка:${link}\nСтатус ответа: ${status}`
          );
        }
      } catch (err) {
        if (err) {
          console.log(err.message);
        }
      }
    });
  } catch (err) {
    if (err) {
      console.log(err);
    }
  }
};
