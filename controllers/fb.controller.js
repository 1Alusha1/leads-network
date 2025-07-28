import dotenv from "dotenv";
import { fbLeadsTarget } from "../utils/parseLead.js";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
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
  const { entry } = req.body;

  console.log(
    "📥 Получено сообщение от Facebook:",
    JSON.stringify(req.body, null, 2)
  );

  entry.forEach(async (lead) => {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${lead.changes[0].value.leadgen_id}?access_token=EAAZAi6xZBiVCcBPNzZC54oJkHI5oMtRZBFKiejAQ0YIRfchAmCIUUvZAZA3zU5poKXUVwJk275ZADvi7QFzUeJkQz7yed6swyyGHZBJYC9jNbtAkHuiMsUHZBR19BHTHK8ZBi9cZB7b5jND8hR92QNHibdwzq9MmwG8Ix4YB6XtqzOZBnh9v7atpTZBUcGXRPKwEv4puGYvjUqi2u1nHbmbpZBmEYQkJMoh2CmPVm0ybUZD`
    );
    const data = await response.json();
    console.log(data);
    console.log(fbLeadsTarget(data));
  });

  res.sendStatus(200);
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
      userModel.findOne({ authToken }, { fb_token }, { new: true });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message, type: "error" });
  }
};
