// models/Org.js
const mongoose = require("mongoose");

const OrgSchema = new mongoose.Schema({
  name: String,
  apiKey: String,
  allowedOrigins: [String]
});

module.exports = mongoose.model("Org", OrgSchema);