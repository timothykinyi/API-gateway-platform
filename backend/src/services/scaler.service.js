const axios = require("axios");
const Server = require("../models/Server");

async function wakeServer(server) {
  try {
    await axios.post(server.url + "/wake");

    server.status = "active";
    await server.save();

    console.log(`${server.url} WOKE`);
  } catch (err) {
    console.log(`Failed to wake ${server.url}`);
  }
}

async function sleepServer(server) {
  try {
    await axios.post(server.url + "/sleep");

    server.status = "sleeping";
    await server.save();

    console.log(`${server.url} SLEEP`);
  } catch (err) {
    console.log(`Failed to sleep ${server.url}`);
  }
}

module.exports = { wakeServer, sleepServer };