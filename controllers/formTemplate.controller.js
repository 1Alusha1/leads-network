import leadFormTemplateModel from "../models/formTemplate.model.js";
import userModel from "../models/user.model.js";

export const getTemplates = async (req, res) => {
  const { userId } = req.query;
  try {
    const template = await leadFormTemplateModel.find({ userId });

    if (!template.length) {
      return res
        .status(400)
        .json({ message: "У вас нет шаблонов форм", type: "error" });
    }

    return res.status(200).json({
      message: "Шаблоны получены успешно",
      type: "success",
      data: template,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, type: "error" });
  }
};

export const updateTemplate = async (req, res) => {
  const { formId } = req.body;

  try {
    const updatableFields = ["adset", "sheet", "tableId", "name"];
    const filter = { formId };
    const update = {};

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const updated = await leadFormTemplateModel.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Шаблон не найден", type: "error" });
    }

    res
      .status(201)
      .json({ message: "Шаблон обновлён", type: "success", data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message, type: "error" });
  }
};

export const deleteTemplate = async (req, res) => {
  const { _id, formId } = req.body;

  console.log(req.body);
  if (!_id || !formId) {
    return res.status(400).json({
      message: "Отсутствует _id или formId",
      type: "error",
    });
  }

  try {
    await leadFormTemplateModel.findOneAndDelete({ _id });

    const updateResult = await userModel.updateOne(
      { _id },
      { $pull: { connectedForm: { formId } } },
    );

    console.log(updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        message: "Форма с таким formId не найдена у пользователя",
        type: "error",
      });
    }

    return res.status(200).json({
      message: "Форма удалена",
      type: "success",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      type: "error",
    });
  }
};
