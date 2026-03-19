const servers = require("./servers");
const redis = require("./redis");

let currentIndex = 0;

async function getServer(request) {
  const aliveServers = servers.filter(s => s.alive);

  if (aliveServers.length === 0) {
    throw new Error("No servers available");
  }

  const sessionId = request.headers["x-session-id"];

  // 🔁 Check existing session
  if (sessionId) {
    const saved = await redis.get(`session:${sessionId}`);

    if (saved) {
      const server = aliveServers.find(s => s.id === saved);
      if (server) return server;
    }
  }

  // 🆕 Assign new server
  const server = aliveServers[currentIndex % aliveServers.length];
  currentIndex++;

  // 💾 Save session
  if (sessionId) {
    await redis.set(`session:${sessionId}`, server.id, "EX", 300);
  }

  return server;
}

module.exports = { getServer };