import mongoose from "mongoose";

const { Schema } = mongoose;

const HashSchema = new Schema({
  sessionId: String,
  addSet: String,
  geo: String,
});


export default mongoose.model("Hash", HashSchema)
