require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const orgRoutes = require("./routes/org.routes");
//const { startHealthChecks } = require("./services/health.service");
//const routingRoutes = require("./routes/routing.routes");

const loadBalancerRoutes = require("./routes/loadBalancer.routes");
const { startHealthChecks } = require("./routes/loadBalancer.routes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.set("trust proxy", true);
// DB
connectDB();

// Routes
app.use("/api/orgs", orgRoutes);
app.use("/route", loadBalancerRoutes);

// Health check
app.get("/", (req, res) => {
  res.send({ status: "Load Balancer API Running" });
});

// Start periodic health checks
startHealthChecks();

const keepServerActive = (url) => {
  const req = https.get(url, (res) => {
    console.log(`Pinged ${url} - Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.error(`Error pinging ${url}:`, err.message);
  });
  req.end();
};

setInterval(() => keepServerActive(process.env.PING_URLn), 720000);

// Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});