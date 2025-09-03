import mongoose from "mongoose";

const { Schema } = mongoose;

const duplicateLeadsModel = new Schema({
  full_name: String,
  phone: String,
  email: String,
  description: String,
  country: String,
  landing: String,
  landing_name: String,
  ip: String,
  user_id: Number,
  source: String,
});

export default mongoose.model("duplicateLeads", duplicateLeadsModel);
