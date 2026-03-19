const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.send({ status: "ok" });
});

app.all(/.*/, (req, res) => {
  res.send("Response from SERVER 2");
});

app.listen(3002, () => {
  console.log("Server 2 running on port 3002");
});