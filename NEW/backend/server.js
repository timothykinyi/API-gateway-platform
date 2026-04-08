require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const https = require("https");

const connectDB = require("./config/db");
const orgRoutes = require("./routes/org.routes");
const loadBalancerRoutes = require("./routes/loadBalancer.routes");
const { startHealthChecks } = require("./routes/loadBalancer.routes");

const app = express();

/* -----------------------------------------------
   🔓 OPEN CORS MIDDLEWARE FOR /route
------------------------------------------------- */
const allowAllCors = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};

/* -----------------------------------------------
   🔓 OPEN ROUTE (LOAD BALANCER) - DEFINED FIRST
------------------------------------------------- */
app.use("/route", allowAllCors, loadBalancerRoutes);

/* -----------------------------------------------
   🔒 STRICT CORS (DEFAULT FOR EVERYTHING ELSE)
------------------------------------------------- */
const allowedOrigins = [
  "https://kai-whatsapp-bot.web.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* -----------------------------------------------
   ✅ STANDARD MIDDLEWARE
------------------------------------------------- */
app.use(express.json());
app.use(morgan("dev"));
app.set("trust proxy", true);

/* -----------------------------------------------
   ✅ DB
------------------------------------------------- */
connectDB();

/* -----------------------------------------------
   🔒 PROTECTED ROUTES
------------------------------------------------- */
app.use("/api/orgs", orgRoutes);

/* -----------------------------------------------
   ✅ HEALTH + ROOT
------------------------------------------------- */
app.get("/", (req, res) => {
  res.send({ status: "Load Balancer API Running" });
});

app.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      timestamp: Date.now(),
      server: 5000,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

/* -----------------------------------------------
   ✅ START HEALTH CHECKS
------------------------------------------------- */
startHealthChecks();

/* -----------------------------------------------
   ✅ KEEP SERVER ALIVE
------------------------------------------------- */
const keepServerActive = (url) => {
  const req = https.get(url, (res) => {
    console.log(`Pinged ${url} - Status: ${res.statusCode}`);
  });

  req.on("error", (err) => {
    console.error(`Error pinging ${url}:`, err.message);
  });

  req.end();
};

setInterval(() => {
  if (process.env.PING_URL) {
    keepServerActive(process.env.PING_URL);
  }
}, 720000);

/* -----------------------------------------------
   ✅ START SERVER
------------------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 main Server running on port ${PORT}`);
});