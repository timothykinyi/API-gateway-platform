const axios = require("axios");
const { getServer } = require("../services/balancer.service");
const rateLimit = require("../services/rateLimit.service");
const { recordRequest } = require("../utils/metrics");
const Org = require("../models/Org");

async function handleRequest(request, reply) {
  const allowed = await rateLimit(request, reply);
  if (!allowed) return;

  const start = Date.now();

  try {
    const apiKey = request.headers["x-api-key"];

    const org = await Org.findOne({ apiKey });
    if (!org) {
      return reply.code(403).send({ error: "Invalid org" });
    }

    let server = await getServer(request, org._id);

    let response;

    try {
      // 🔥 Primary request
      response = await axios({
        method: request.method,
        url: server.url + request.url,
        headers: request.headers,
        data: request.body,
        timeout: 2000,
        validateStatus: () => true
      });

    } catch (err) {
      console.log("Primary failed → retrying...");

      // 🔁 Retry with another server
      server = await getServer(request, org._id);

      response = await axios({
        method: request.method,
        url: server.url + request.url,
        headers: request.headers,
        data: request.body,
        validateStatus: () => true
      });
    }

    const duration = Date.now() - start;
    recordRequest(duration);

    reply.code(response.status).send(response.data);

  } catch (err) {
    console.error("Gateway error:", err.message);
    reply.code(503).send({ error: "Gateway error" });
  }
}

module.exports = { handleRequest };