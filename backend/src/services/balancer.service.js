const redis = require("../config/redis");
const Server = require("../models/Server");
const { wakeServer } = require("./scaler.service");

let currentIndex = 0;

async function getServer(request, orgId) {
  let servers = await Server.find({
    orgId,
    status: "active"
  });

  // 💥 FAILOVER: no active servers → wake one
  if (servers.length === 0) {
    console.log("No active servers → waking one...");

    const sleeping = await Server.find({
      orgId,
      status: "sleeping"
    });

    if (sleeping.length > 0) {
      await wakeServer(sleeping[0]);
      return sleeping[0];
    }

    throw new Error("No servers available");
  }

  const sessionId = request.headers["x-session-id"];

  // 🔁 Sticky session
  if (sessionId) {
    const saved = await redis.get(`session:${sessionId}`);

    const match = servers.find(s => s.id === saved);
    if (match) return match;
  }

  // 🔄 Round robin
  const server = servers[currentIndex % servers.length];
  currentIndex++;

  // 💾 Save session
  if (sessionId) {
    await redis.set(`session:${sessionId}`, server.id, "EX", 300);
  }

  return server;
}

module.exports = { getServer };