// models/requestQueue.model.js
const mongoose = require("mongoose");

const requestQueueSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: "Org", required: true },
  method: { type: String, required: true },
  url: { type: String, required: true },
  headers: { type: Object },
  body: { type: Object },
  query: { type: Object },
  retries: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RequestQueue", requestQueueSchema);