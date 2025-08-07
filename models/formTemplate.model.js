import mongoose from "mongoose";

const { Schema } = mongoose;

const LeadFormTemplateModel = new Schema({
  name: String,
  formId: Number,
  type: String,
  tableId: String,
  sheet: String,
  userId: String,
  adset: String,
  pageId: String,
  source:String,
  user_id:String,
  landing:String,
  landing_name:String,
});


export default mongoose.model("LeadFormTemplate", LeadFormTemplateModel);
