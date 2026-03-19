const express = require("express");
const app = express();

app.use(express.json());

let state = "active"; // active | sleeping

// ----------------------
// CONTROL ROUTES
// ----------------------
app.post("/sleep", (req, res) => {
  state = "sleeping";
  console.log("Server 2 → SLEEPING");
  res.send({ status: "sleeping" });
});

app.post("/wake", (req, res) => {
  state = "active";
  console.log("Server 2 → ACTIVE");
  res.send({ status: "active" });
});

// ----------------------
// HEALTH CHECK (IMPORTANT FIX)
// ----------------------
app.get("/health", (req, res) => {
  res.send({
    status: state,        // 👈 KEY CHANGE
    server: "server2"
  });
});

// ----------------------
// MAIN HANDLER
// ----------------------
app.use((req, res) => {
  if (state === "sleeping") {
    return res.status(503).send({
      error: "Server sleeping"
    });
  }

  res.send({
    message: "Response from SERVER 2",
    state
  });
});

// ----------------------
app.listen(3002, () => {
  console.log("Server 2 running on port 3002");
});