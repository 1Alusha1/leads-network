import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema({
  login: String,
  password: String,
  fb_token: String,
  authToken: String,
  connectedForm: Object,
});

export default mongoose.model("User", UserSchema);
