import duplicateLeadsModel from "../models/duplicateLeads.model.js";

export const uploadLeads = async (req, res) => {
  try {
    const { leads = [] } = req.body;

    if (!Array.isArray(leads)) {
      return res
        .status(400)
        .json({ message: "leads должен быть массивом", type: "error" });
    }

    // телефоны из базы
    const dbLeads = await duplicateLeadsModel.find({}, "phone");
    const dbPhones = dbLeads.map((l) => l.phone);

    // фильтруем только новые
    const newLeads = leads.filter((lead) => !dbPhones.includes(lead.phone));

    if (newLeads.length === 0) {
      return res
        .status(200)
        .json({ message: "Новых лидов нет", type: "success" });
    }

    await duplicateLeadsModel.insertMany(newLeads);

    return res.status(200).json({
      message: "Лиды сохранены",
      type: "success",
      saved: newLeads.length,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};

export const fileterdLeads = async (req, res) => {
  try {
    const { leads = [] } = req.body;

    if (!Array.isArray(leads)) {
      return res.status(400).json({
        message: "Поле 'leads' должно быть массивом объектов",
        type: "error",
      });
    }

    // вытаскиваем все телефоны из базы
    const dbLeads = await duplicateLeadsModel.find({}, "phone");
    const dbPhones = dbLeads.map((l) => l.phone);

    // фильтруем: оставляем только новые лиды
    const newLeads = leads.filter((lead) => !dbPhones.includes(lead.phone));

    // возвращаем только новых лидов
    return res.status(200).json({
      message: "Лиды отфильтрованы",
      type: "success",
      data: newLeads,
      count: newLeads.length,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, type: "error" });
  }
};
