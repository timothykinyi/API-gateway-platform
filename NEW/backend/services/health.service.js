const axios = require("axios");
const Org = require("../models/org.model");

const HEALTH_INTERVAL = 1 * 60 * 100; // 2 minutes

/**
 * Ping a server to check if it's alive
 * @param {*} server
 * @returns { status: "active"|"down", responseTime: number|null }
 */
const checkServer = async (server) => {
  const start = Date.now();
  try {
    await axios.get(server.url, { timeout: 5000 });
    const responseTime = Date.now() - start;
    return { status: "active", responseTime };
  } catch {
    return { status: "down", responseTime: null };
  }
};

/**
 * Determine the primary server or pick a new one if needed
 * @param {*} org
 */
const ensurePrimaryServer = async (org) => {
  const primary = org.servers.find((s) => s.isPrimary);

  // If primary exists and is active, nothing to do
  if (primary && primary.status === "active") return;

  // Primary is missing or down → pick first sleeping or active server
  const candidate = org.servers.find(
    (s) => s.status === "active" || s.status === "newactive" || s.status === "sleeping" 
  );

  if (!candidate) return; // no server available

  // Wake it if it was sleeping
  if (candidate.status === "sleeping") {
    console.log(`⚡ Waking server ${candidate.url} for org ${org.name}`);
    const result = await checkServer(candidate);
    candidate.status = result.status === "active" ? "active" : "down";
    candidate.responseTime = result.responseTime;
    candidate.lastChecked = new Date();
    if (candidate.status !== "active") {
      console.log(`❌ Candidate failed to wake: ${candidate.url}`);
      return;
    }
  }
    if (candidate.status === "newactive") {
    console.log(`⚡ Waking server ${candidate.url} for org ${org.name}`);
    const result = await checkServer(candidate);
    candidate.status = result.status === "active" ? "active" : "down";
    candidate.responseTime = result.responseTime;
    candidate.lastChecked = new Date();
    if (candidate.status !== "active") {
      console.log(`❌ Candidate failed to wake: ${candidate.url}`);
      return;
    }
  }

  // Make this candidate the new primary
  org.servers.forEach((s) => (s.isPrimary = false));
  candidate.isPrimary = true;
  console.log(`✅ Server ${candidate.url} is now primary for org ${org.name}`);
};

/**
 * Main health check loop
 */
const runHealthChecks = async () => {
  try {
    const orgs = await Org.find();

    for (const org of orgs) {
      // 1️⃣ Check primary server
      const primary = org.servers.find((s) => s.isPrimary);
      if (primary) {
        const result = await checkServer(primary);
        primary.status = result.status;
        primary.responseTime = result.responseTime;
        primary.lastChecked = new Date();

        if (result.status === "down") {
          console.log(`❌ Primary server down: ${primary.url}`);
        }
      }

      // 2️⃣ Check down servers (attempt to fix them)
      const downServers = org.servers.filter((s) => s.status === "down");
      for (const server of downServers) {
        const result = await checkServer(server);
        server.status = result.status === "active" ? "sleeping" : "down"; // back to sleeping if fixed
        server.responseTime = result.responseTime;
        server.lastChecked = new Date();
        if (result.status === "active") {
          console.log(`⚡ Down server ${server.url} is now sleeping`);
        }
      }

      // 3️⃣ Check newly added servers that are active but not primary
      const nonPrimaryActive = org.servers.filter(
        (s) => !s.isPrimary && s.status === "newactive"
      );
      for (const server of nonPrimaryActive) {
        server.status = "sleeping"; // only primary is active
      }

      // 4️⃣ Ensure there is always a primary server
      await ensurePrimaryServer(org);

      await org.save();
    }

    console.log("✅ Health check run complete");
  } catch (err) {
    console.error("❌ Health check error:", err.message);
  }
};

/**
 * Start periodic health checks
 */
const startHealthChecks = () => {
  runHealthChecks(); // immediate run
  setInterval(runHealthChecks, HEALTH_INTERVAL);
};

module.exports = { startHealthChecks };