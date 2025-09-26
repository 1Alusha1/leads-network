import mongoose from "mongoose";

const { Schema } = mongoose;

const antiFraud = new Schema({
  phone: { type: String, unique: true, required: true },
  email: String,
});

export default mongoose.model("antiFraud", antiFraud);
