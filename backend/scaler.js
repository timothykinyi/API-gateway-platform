const axios = require("axios");
const servers = require("./servers");

async function wakeServer(server) {
  try {
    await axios.post(server.url + "/wake");
    server.status = "active";
    console.log(`${server.id} WOKE UP`);
  } catch (err) {
    console.log(`Failed to wake ${server.id}`);
  }
}

async function sleepServer(server) {
  try {
    await axios.post(server.url + "/sleep");
    server.status = "sleeping";
    console.log(`${server.id} SLEEPING`);
  } catch (err) {
    console.log(`Failed to sleep ${server.id}`);
  }
}

module.exports = { wakeServer, sleepServer };