import { sendTelegram } from '../index.js';
import antiFraudModel from '../models/antiFraud.model.js';
import { smsCode } from '../models/antiFraud.model.js';
import { config } from 'dotenv';
config();

export const searchLead = async (req, res) => {
  const { phone, email } = req.query;

  try {
    const lead = await antiFraudModel.findOne({ phone });

    if (lead) {
      return res.status(200).json({ message: 'Lead found', isDuble: true });
    }

    await new antiFraudModel({ phone, email }).save();

    return res.status(200).json({ message: 'Lead not found', isDuble: false });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: 'Ошибка при проверке лида', error: err.message });
  }
};

const generateCode = () => {
  let code = '';

  for (let i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * 10);
  }

  return code;
};

export const createAndSendCode = async (req, res) => {
  try {
    console.log(req.query);
    const { phone, token, chat_id, text } = req.query;

    if (!token || !chat_id || !text || !phone) {
      return res.status(400).json({
        success: false,
        error: 'token, chat_id и message обязательны',
      });
    }

    const newCode = new smsCode({
      code: generateCode(),
    });

    await newCode.save();
    const apiUri = 'https://sms.didglobal.biz';
    const response = await fetch(
      `${apiUri}/rest/send_sms?from=MVD&to=${phone}&message=Ваш код ${newCode.code}&username=${process.env.CALL_USERNAME}&password=${process.env.CALL_PASS}`
    );
    const data = await response.json();

    console.log(data);
    console.log(newCode);
    await sendTelegram(token, chat_id, text);
    return res
      .status(201)
      .json({ message: 'Code was save and sended', newCode });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: 'Ошибка при генирации кода', error: err.message });
  }
};

export const checkCode = async (req, res) => {
  try {
    const { code } = req.body;

    const existCode = await smsCode.findOne({ code });

    if (existCode?.code) {
      await smsCode.findOneAndDelete({ code: existCode?.code });

      return res.status(200).json({ msg: 'Code is valid', isValid: true });
    }

    return res
      .status(400)
      .json({ message: "Code doesn't exist", isValid: false });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: 'Ошибка при проверке кода', error: err.message });
  }
};

export const sendToCrm = async (req, res) => {
  try {
    const { dto } = req.body;
    /**
     *  dto
     *  "email": "test8u2u2576@gmail.com",
     *  "full_name": "Test Test",
     *  "landing": "domain.ru",
     *  "country": "IT",
     *  "landing_name": "Test-funnel",
     *  "user_id": 1,
     *  "source": "FB",
     *  "phone": "393895421210",
     *  "ip": "78.208.2.210",
     *  "description": "quiz"
     */
    for (let i = 0; i < dto.length; i++) {
      const formBody = new URLSearchParams(dto[i]).toString();

      try {
        const response = await fetch(process.env.CRM_URI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formBody,
        });

        if (response.status === 422) {
          res.status(422).json({ msg: 'Ошибка при отправке лида' });
        }

        const data = await response.json();
        console.log(data);
        res.status(201).json({ msg: data.message });
      } catch (err) {
        res.status(500).json({ msg: err.message });
      }
    }
  } catch (err) {}
};
