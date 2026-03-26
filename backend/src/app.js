const Fastify = require("fastify");
require("dotenv").config();

const routes = require("./routes/gateway.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/userRoutes"); // ⚠️ we'll adjust this

const connectDB = require("./config/db");

const { startHealthChecks } = require("./services/health.service");
const { getMetrics, resetMetrics } = require("./utils/metrics");
const { wakeServer, sleepServer } = require("./services/scaler.service");

const Server = require("./models/Server");

const app = Fastify({
  logger: true,
});

// ----------------------
// DB
// ----------------------
connectDB();

// ----------------------
// Routes (Fastify style)
// ----------------------
app.register(routes);
app.register(adminRoutes);

// 👇 FIX: wrap Express-style routes into Fastify
app.register(async function (fastify) {
  fastify.post("/api/users/register", async (request, reply) => {
    return userRoutes.createUser(request, reply);
  });

  fastify.get("/api/users", async (request, reply) => {
    return userRoutes.getUsers(request, reply);
  });

  fastify.get("/api/users/:id", async (request, reply) => {
    return userRoutes.getUserById(request, reply);
  });
});

// ----------------------
// Health checks
// ----------------------
startHealthChecks();

// ----------------------
// Intelligent Scaling
// ----------------------
setInterval(async () => {
  try {
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

    resetMetrics();
  } catch (err) {
    console.error("Scaling error:", err.message);
  }
}, 3000);

module.exports = app;