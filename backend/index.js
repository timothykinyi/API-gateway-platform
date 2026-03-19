const Fastify = require("fastify");
const axios = require("axios");
const redis = require("./redis");


const { startHealthChecks } = require("./health");
const { getServer } = require("./balancer");

const app = Fastify();

startHealthChecks();


async function rateLimit(request, reply) {
  const ip = request.ip;

  const key = `rate:${ip}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60); // 1 minute
  }

  if (count > 60) {
    reply.code(429).send({
      error: "Too many requests"
    });
    return false;
  }

  return true;
}


app.all("/*", async (request, reply) => {
  const allowed = await rateLimit(request, reply);
  if (!allowed) return;

  try {
    const server = await getServer(request);

    console.log(`Routing → ${server.id}`);

    const response = await axios({
      method: request.method,
      url: server.url + request.url,
      headers: request.headers,
      data: request.body,
      validateStatus: () => true
    });

    reply.code(response.status).send(response.data);

  } catch (err) {
    console.error("Error:", err.message);

    reply.code(503).send({
      error: "No available servers"
    });
  }
});

app.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Load balancer running on http://localhost:3000");
});