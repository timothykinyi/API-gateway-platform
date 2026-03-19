const express = require("express");
const app = express(); // ✅ MUST come before using app

let isAwake = true;

// ----------------------
// CONTROL ROUTES
// ----------------------
app.post("/sleep", (req, res) => {
  isAwake = false;
  console.log("Server 1 sleeping...");
  res.send({ status: "sleeping" });
});

app.post("/wake", (req, res) => {
  isAwake = true;
  console.log("Server 1 waking up...");
  res.send({ status: "awake" });
});

// ----------------------
// HEALTH CHECK
// ----------------------
app.get("/health", (req, res) => {
  if (!isAwake) {
    return res.status(503).send({ status: "sleeping" });
  }
  res.send({ status: "ok" });
});

// ----------------------
// MAIN HANDLER
// ----------------------
app.use((req, res) => {
  if (!isAwake) {
    return res.status(503).send("Server sleeping");
  }
  res.send("Response from SERVER 1");
});

// ----------------------
app.listen(3001, () => {
  console.log("Server 1 running on port 3001");
});