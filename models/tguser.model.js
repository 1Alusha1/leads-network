const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const TGUserSchema = new Schema({
  username: String,
  userId: String,
  geo: String,
});

module.exports = mongoose.model("TGUser", TGUserSchema);
