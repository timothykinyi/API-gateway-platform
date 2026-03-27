const express = require("express");
const axios = require("axios");
const Org = require("../models/org.model");

const router = express.Router();

// ----------------- Config -----------------
const HEALTH_INTERVAL = 5 * 60 * 1000;
const SPIKE_WINDOW = 10 * 1000;
const SPIKE_THRESHOLD = 10;
const SCALE_DOWN_COOLDOWN = 30 * 1000;

const IP_WINDOW = 10 * 1000;
const IP_THRESHOLD = 20;
const IP_BLOCK_TIME = 60 * 1000;

const ipTrafficMap = new Map();
const blockedIPs = new Map();

setInterval(() => {
  ipTrafficMap.clear();
}, IP_WINDOW);

// ----------------- RATE LIMIT -----------------

const checkIPRateLimit = (req, res) => {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown";

  const blockedUntil = blockedIPs.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    console.log(`🚫 Blocked IP: ${ip}`);
    res.status(429).json({ error: "Too many requests. Try later." });
    return false;
  }

  const key = `${ip}_${req.params.orgId}`;
  const count = ipTrafficMap.get(key) || 0;
  ipTrafficMap.set(key, count + 1);

  if (count + 1 > IP_THRESHOLD) {
    console.log(`🚨 DDoS detected from IP: ${ip}`);
    blockedIPs.set(ip, Date.now() + IP_BLOCK_TIME);

    res.status(429).json({ error: "You are temporarily blocked." });
    return false;
  }

  return true;
};

// ----------------- ROUND ROBIN -----------------

const roundRobinIndex = new Map();

const getNextServer = (org, activeServers) => {
  const orgId = org._id.toString();
  let index = roundRobinIndex.get(orgId) || 0;

  const server = activeServers[index % activeServers.length];

  roundRobinIndex.set(orgId, (index + 1) % activeServers.length);

  return server;
};

// ----------------- HELPERS -----------------

const checkServer = async (server) => {
  const start = Date.now();
  try {
    await axios.get(server.url, { timeout: 5000 });
    return { status: "active", responseTime: Date.now() - start };
  } catch {
    return { status: "down", responseTime: null };
  }
};

// ----------------- TRAFFIC -----------------

const updateTraffic = async (org) => {
  org.runtime.requestCount += 1;
};

const resetTraffic = async () => {
  await Org.updateMany({}, { $set: { "runtime.requestCount": 0 } });
};

setInterval(resetTraffic, SPIKE_WINDOW);

// ----------------- SCALING -----------------

const wakeSleepingServers = async (org) => {
  const sleeping = org.servers.filter(s => s.status === "sleeping");

  for (const server of sleeping) {
    const result = await checkServer(server);
    if (result.status === "active") {
      server.status = "active";
      server.responseTime = result.responseTime;
      server.lastChecked = new Date();
      console.log(`⚡ Woke ${server.url}`);
    }
  }
};

const scaleDownServers = async (org) => {
  const now = Date.now();

  if (now - org.runtime.lastHighTrafficTime < SCALE_DOWN_COOLDOWN) return;

  for (const server of org.servers) {
    if (server.isPrimary) continue;

    if (server.status === "active") {
      server.status = "sleeping";
      console.log(`😴 Sleeping ${server.url}`);
    }
  }
};

const handleScaling = async (org) => {
  if (org.runtime.requestCount >= SPIKE_THRESHOLD) {
    org.runtime.lastHighTrafficTime = Date.now();
    await wakeSleepingServers(org);
  } else {
    await scaleDownServers(org);
  }
};

// ----------------- PRIMARY -----------------

const ensurePrimary = async (org) => {
  let primary = org.servers.find(s => s.isPrimary && s.status === "active");
  if (primary) return primary;

  const candidate = org.servers.find(s =>
    ["active", "sleeping", "newactive"].includes(s.status)
  );

  if (!candidate) return null;

  if (candidate.status !== "active") {
    const result = await checkServer(candidate);
    candidate.status = result.status === "active" ? "active" : "down";
    candidate.responseTime = result.responseTime;
    candidate.lastChecked = new Date();

    if (candidate.status !== "active") return null;
  }

  org.servers.forEach(s => (s.isPrimary = false));
  candidate.isPrimary = true;

  console.log(`✅ New primary: ${candidate.url}`);
  return candidate;
};

const ensureactive = async (org) => {
  const candidate = org.servers.find(s => s.status === "newactive");

  if (!candidate) return null;

  const result = await checkServer(candidate);
  candidate.status = result.status === "active" ? "sleeping" : "down";
  candidate.responseTime = result.responseTime;
  candidate.lastChecked = new Date();

  await org.save();
  return candidate;
};

// ----------------- CORE ROUTE -----------------

router.get("/:orgId", async (req, res) => {
  try {
    if (!checkIPRateLimit(req, res)) return;

    const org = await Org.findById(req.params.orgId);

    if (!org) {
      return res.status(404).json({ error: "Org not found" });
    }

    await updateTraffic(org);
    await handleScaling(org);

    const primary = await ensurePrimary(org);

    if (!primary) {
      return res.status(503).json({ error: "No available servers" });
    }

    const activeServers = org.servers.filter(s => s.status === "active");

    if (!activeServers.length) {
      return res.status(503).json({ error: "No active servers" });
    }

    const selectedServer = getNextServer(org, activeServers);

    await org.save();

    // 🔥 THIS IS THE NEW BEHAVIOR
    console.log(`🎯 Selected Server: ${selectedServer.url}`);

    return res.json({
      serverUrl: selectedServer.url,
      status: selectedServer.status,
      responseTime: selectedServer.responseTime,
      isPrimary: selectedServer.isPrimary
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to get server" });
  }
});

module.exports = router;

// ----------------- HEALTH -----------------

const startHealthChecks = () => {
  setInterval(async () => {
    const orgs = await Org.find();

    for (const org of orgs) {
      const primary = org.servers.find(s => s.isPrimary);

      if (primary) {
        const result = await checkServer(primary);
        primary.status = result.status;
        primary.responseTime = result.responseTime;
        primary.lastChecked = new Date();
      }

      const downServers = org.servers.filter(s => s.status === "down");

      for (const server of downServers) {
        const result = await checkServer(server);

        server.status = result.status === "active" ? "sleeping" : "down";
        server.responseTime = result.responseTime;
        server.lastChecked = new Date();
      }

      await ensurePrimary(org);
      await ensureactive(org);
      await org.save();
    }

    console.log("✅ Health check done");
  }, HEALTH_INTERVAL);
};

module.exports.startHealthChecks = startHealthChecks;