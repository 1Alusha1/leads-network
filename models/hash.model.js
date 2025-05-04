const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const HashSchema = new Schema({
  sessionId: String,
  addSet: String,
  geo: String,
});

module.exports = mongoose.model("Hash", HashSchema);
