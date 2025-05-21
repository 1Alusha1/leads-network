import mongoose from "mongoose";

const { Schema } = mongoose;

const waUserSchema = new Schema({
  phone: String,
  name: String,
  geo: String,
});

export default mongoose.model("WAUser", waUserSchema);
