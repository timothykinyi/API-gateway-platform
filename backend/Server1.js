const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.send({ status: "ok" });
});

app.all(/.*/, (req, res) => {
  res.send("Response from SERVER 1");
});

app.listen(3001, () => {
  console.log("Server 1 running on port 3001");
});