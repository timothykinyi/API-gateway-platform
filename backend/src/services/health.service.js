const axios = require("axios");
const Server = require("../models/Server");

async function checkHealth() {
  const servers = await Server.find();

  for (const server of servers) {
    try {
      const res = await axios.get(server.url + "/health", {
        timeout: 2000
      });

      const state = res.data.status;

      if (state === "active") {
        server.status = "active";
      } else if (state === "sleeping") {
        server.status = "sleeping";
      }

      // 🔥 revive if was dead
      if (server.status === "dead") {
        console.log(`${server.url} revived`);
      }

    } catch (err) {
      console.log(`${server.url} is DOWN`);
      server.status = "dead";
    }

    await server.save();
  }
}

function startHealthChecks() {
  setInterval(checkHealth, 5000);
}

module.exports = { startHealthChecks };