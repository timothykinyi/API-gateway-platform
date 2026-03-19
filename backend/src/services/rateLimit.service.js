const redis = require("../config/redis");

async function rateLimit(request, reply) {
  const key = `rate:${request.ip}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60);
  }

  if (count > 100) {
    reply.code(429).send({ error: "Too many requests" });
    return false;
  }

  return true;
}

module.exports = rateLimit;