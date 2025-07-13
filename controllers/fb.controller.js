import dotenv from "dotenv";
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

export const sendDataToCRM = (req, res) => {
  console.log(
    "📥 Получено сообщение от Facebook:",
    JSON.stringify(req.body, null, 2)
  );

  // тут можешь, например, сохранить лид или отправить в Telegram

  res.sendStatus(200); // Facebook требует 200 OK
};
