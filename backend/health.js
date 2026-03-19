const axios = require("axios");
const servers = require("./servers");

async function checkHealth() {
  for (const server of servers) {
    try {
      await axios.get(server.url + "/health");
      server.alive = true;
    } catch (err) {
      server.alive = false;
    }
  }
}

// run every 5 seconds
function startHealthChecks() {
  setInterval(checkHealth, 5000);
}

module.exports = { startHealthChecks };