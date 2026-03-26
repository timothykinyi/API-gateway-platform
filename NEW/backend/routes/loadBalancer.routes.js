const express = require("express");
const axios = require("axios");
const Org = require("../models/org.model");
const RequestQueue = require("../models/requestQueue.model");

const router = express.Router();

// ----------------- Config -----------------
const HEALTH_INTERVAL = 1 * 60 * 1000;
const SPIKE_WINDOW = 10 * 1000;
const SPIKE_THRESHOLD = 10;
const MAX_RETRIES = 2;
const SCALE_DOWN_COOLDOWN = 30 * 1000;

const IP_WINDOW = 10 * 1000; // 10 sec
const IP_THRESHOLD = 20; // max requests per window
const IP_BLOCK_TIME = 60 * 1000; // 1 min
const ipTrafficMap = new Map(); // ip → count
const blockedIPs = new Map(); // ip → unblockTime

setInterval(() => {
  ipTrafficMap.clear();
}, IP_WINDOW);
// Round robin per org

const checkIPRateLimit = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  // 🔒 Check if blocked
  const blockedUntil = blockedIPs.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    console.log(`🚫 Blocked IP: ${ip}`);
    res.status(429).json({ error: "Too many requests. Try later." });
    return false;
  }

  // ⏳ Count requests
  //const count = ipTrafficMap.get(ip) || 0;
  const key = `${ip}_${req.params.orgId}`;
  const count = ipTrafficMap.get(key) || 0
  ipTrafficMap.set(key, count + 1);

  // 🚨 Detect spike
  if (count + 1 > IP_THRESHOLD) {
    console.log(`🚨 DDoS detected from IP: ${ip}`);

    blockedIPs.set(ip, Date.now() + IP_BLOCK_TIME);

    res.status(429).json({ error: "You are temporarily blocked." });
    return false;
  }

  return true;
};

const roundRobinIndex = new Map();

// ----------------- Helpers -----------------

const checkServer = async (server) => {
  const start = Date.now();
  try {
    await axios.get(server.url, { timeout: 5000 });
    return { status: "active", responseTime: Date.now() - start };
  } catch {
    return { status: "down", responseTime: null };
  }
};

// ----------------- SCALING -----------------

const updateTraffic = async (org) => {
  org.runtime.requestCount += 1;
};

const resetTraffic = async () => {
  await Org.updateMany({}, { $set: { "runtime.requestCount": 0 } });
};
setInterval(resetTraffic, SPIKE_WINDOW);

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

  const candidate = org.servers.find(s =>
    ["newactive"].includes(s.status)
  );

  if (!candidate) return null;

  const result = await checkServer(candidate);
  candidate.status = result.status === "active" ? "sleeping" : "down";
  candidate.responseTime = result.responseTime;
  candidate.lastChecked = new Date();



  await org.save();
  return candidate;
};

// ----------------- ROUND ROBIN -----------------

const getNextServer = (org, activeServers) => {
  const orgId = org._id.toString();
  let index = roundRobinIndex.get(orgId) || 0;

  const server = activeServers[index % activeServers.length];

  roundRobinIndex.set(orgId, (index + 1) % activeServers.length);

  return server;
};

// ----------------- FORWARD -----------------

const forwardRequest = async (server, req) => {
  //const url = `${server.url}/${req.params.path || ""}`;
  const base = server.url.replace(/\/$/, "");
  const path = req.params.path ? `/${req.params.path}` : "";
  const url = base + path;
  try {
    const response = await axios({
      method: req.method.toLowerCase(),
      url,

      // 🔥 CLEAN HEADERS
      headers: {
        Authorization: req.headers.authorization || "",
        "Content-Type": req.headers["content-type"] || "application/json",
      },

      data: req.body,
      params: req.query,
      timeout: 10000,
    });

    return { success: true, data: response };

  } catch (err) {
    const status = err.response?.status;

    if (!status || (status >= 500 && status < 600)) {
      return { success: false };
    }

    return {
      success: false,
      drop: true,
      clientError: err.response?.data || err.message
    };
  }
};

// ----------------- CORE -----------------

const routeRequest = async (req, res, retries = 0) => {
  try {

    if (!checkIPRateLimit(req, res)) return;


    const orgId = req.params.orgId;
    const org = await Org.findById(orgId);

    if (!org) return res.status(404).json({ error: "Org not found" });

    await updateTraffic(org);
    await handleScaling(org);

    const primary = await ensurePrimary(org);

    if (!primary) {
      await RequestQueue.create({
        org: org._id,
        method: req.method,
        url: req.params.path,
        headers: req.headers,
        body: req.body,
        query: req.query,
        retries
      });

      return res.status(503).json({ message: "Queued" });
    }

    const activeServers = org.servers.filter(s => s.status === "active");

    if (!activeServers.length) {
      return res.status(503).json({ error: "No active servers" });
    }
    const server = getNextServer(org, activeServers);

    const result = await forwardRequest(server, req);

    if (result.success) {
      await org.save();
      return res.status(result.data.status).send(result.data.data);
    }

    if (result.drop) {
      return res.status(400).send(result.clientError);
    }

    // fallback
    for (const fallback of activeServers) {
      if (fallback.url === server.url) continue;

      const retry = await forwardRequest(fallback, req);

      if (retry.success) {
        await org.save();
        return res.status(retry.data.status).send(retry.data.data);
      }
    }

    if (retries < MAX_RETRIES) {
      return routeRequest(req, res, retries + 1);
    }

    await RequestQueue.create({
      org: org._id,
      method: req.method,
      url: req.params.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      retries
    });

    return res.status(503).json({ message: "Queued after retries" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Routing failed" });
  }
};

// ----------------- QUEUE -----------------

const processQueue = async () => {
  const items = await RequestQueue.find().limit(50);

  for (const item of items) {
    const fakeReq = {
      method: item.method,
      params: { orgId: item.org.toString(), path: item.url },
      headers: item.headers,
      body: item.body,
      query: item.query
    };

    const fakeRes = { status: () => ({ send: () => {} }) };

    await routeRequest(fakeReq, fakeRes, item.retries);

    await RequestQueue.findByIdAndDelete(item._id);
  }
};
setInterval(processQueue, 5000);

// ----------------- ROUTE -----------------

router.all(/^\/([^/]+)\/?(.*)/, async (req, res) => {
  req.params.orgId = req.params[0];
  req.params.path = req.params[1] || "";
  await routeRequest(req, res);
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