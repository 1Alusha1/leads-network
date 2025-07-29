import mongoose from "mongoose";

const { Schema } = mongoose;

const LeadFormTemplateModel = new Schema({
  formId: Number,
  type: String,
  tableId: String,
  sheet: String,
  userId: String,
  adset: String,
});

export default mongoose.model("LeadFormTemplate", LeadFormTemplateModel);
