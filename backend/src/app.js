const Fastify = require("fastify");
const routes = require("./routes/gateway.routes");
const adminRoutes = require("./routes/admin.routes");
const connectDB = require("./config/db");

const { startHealthChecks } = require("./services/health.service");
const { getMetrics, resetMetrics } = require("./utils/metrics");
const { wakeServer, sleepServer } = require("./services/scaler.service");
const Server = require("./models/Server");

const app = Fastify();

// ----------------------
// DB
// ----------------------
connectDB();

// ----------------------
// Routes
// ----------------------
app.register(routes);
app.register(adminRoutes);

// ----------------------
// Health checks
// ----------------------
startHealthChecks();

// ----------------------
// Intelligent Scaling
// ----------------------
setInterval(async () => {
  const { rps, avgResponseTime } = getMetrics();

  const active = await Server.find({ status: "active" });
  const sleeping = await Server.find({ status: "sleeping" });

  console.log("METRICS:", { rps, avgResponseTime });

  // 🔥 SCALE UP
  if ((rps > 10 || avgResponseTime > 300) && sleeping.length > 0) {
    console.log("Scaling UP...");
    await wakeServer(sleeping[0]);
  }

  // 😴 SCALE DOWN
  if (rps < 3 && active.length > 1) {
    console.log("Scaling DOWN...");
    await sleepServer(active[active.length - 1]);
  }

  // ✅ IMPORTANT
  resetMetrics();

}, 3000);

module.exports = app;