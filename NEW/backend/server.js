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

// ✅ CORS FIX
const allowedOrigins = [
  "http://localhost:3000",
  
  "https://kai-whatsapp-bot.web.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or specific domain
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Other middleware
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

// Start health checks
startHealthChecks();

// Keep server alive
const keepServerActive = (url) => {
  const req = https.get(url, (res) => {
    console.log(`Pinged ${url} - Status: ${res.statusCode}`);
  });

  req.on("error", (err) => {
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