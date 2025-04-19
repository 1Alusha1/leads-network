const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const LogSchema = new Schema({
  strLog: String,
});

module.exports = mongoose.model("Log", LogSchema);