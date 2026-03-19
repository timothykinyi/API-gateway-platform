// models/Server.js
const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema({
  orgId: mongoose.Schema.Types.ObjectId,
  url: String,
  status: {
    type: String,
    enum: ["active", "sleeping", "dead"],
    default: "active"
  },
  lastUsed: Date
});

module.exports = mongoose.model("Server", ServerSchema);