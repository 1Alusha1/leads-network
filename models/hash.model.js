import mongoose from "mongoose";

const { Schema } = mongoose;

const HashSchema = new Schema({
  sessionId: String,
  addSet: String,
  geo: String,
  sheet: String,
  tableId: String,
  chatId: String,
});

export default mongoose.model("Hash", HashSchema);
