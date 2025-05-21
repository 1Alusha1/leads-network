import mongoose from "mongoose";

const { Schema } = mongoose;

const TGUserSchema = new Schema({
  username: String,
  userId: String,
  geo: String,
});

export default mongoose.model("TGUser", TGUserSchema);
