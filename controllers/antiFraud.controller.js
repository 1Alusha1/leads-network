import antiFraudModel from "../models/antiFraud.model.js";

export const searchLead = async (req, res) => {
  const { phone, email } = req.query;

  try {
    const lead = await antiFraudModel.findOne({ phone });

    if (lead) {
      return res.status(200).json({ message: "Lead found", isDuble: true });
    }

    await new antiFraudModel({ phone, email }).save();

    return res.status(200).json({ message: "Lead not found", isDuble: false });
  } catch (err) {
    return res.status(500).json({ msg: "Ошибка при проверке лида" });
  }
};
