const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Root
app.get("/", (req, res) => {
  console.log(`✅ ${PORT} root hit`);
  res.send({ status: "ok", server: PORT });
});

// Test endpoint
app.post("/test", (req, res) => {
  console.log(`📩 ${PORT} received:`, req.body);

  res.send({
    message: "Handled by test server",
    server: PORT,
    body: req.body
  });
});

// ✅ FIXED catch-all route
app.use((req, res) => {
  console.log(`🌍 ${PORT} dynamic hit: ${req.originalUrl}`);

  res.send({
    message: "Dynamic route",
    path: req.originalUrl,
    server: PORT
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});