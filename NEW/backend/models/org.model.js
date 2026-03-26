const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
  url: { type: String, required: true },
  status: { type: String, enum: ["active", "down", "sleeping", "newactive"], default: "newactive" },
  lastChecked: Date,
  responseTime: Number,
  isPrimary: { type: Boolean, default: false } // new field
});

const orgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true,
      unique: true
    },
    servers: [serverSchema],
    runtime: {
    requestCount: { type: Number, default: 0 },
    lastHighTrafficTime: { type: Number, default: 0 }
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Org", orgSchema);