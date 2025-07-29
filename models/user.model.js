import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema({
  login: String,
  password: String,
  fb_token: String,
  authToken: String,
  connectedForm: Array,
});

export default mongoose.model("User", UserSchema);
