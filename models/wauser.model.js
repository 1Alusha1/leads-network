const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const waUserSchema = new Schema({
  phone: String,
  name: String,
  geo: String,
});

module.exports = mongoose.model("WAUser", waUserSchema);
