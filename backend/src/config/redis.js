const Redis = require("ioredis");

// fallback to local if no REDIS_URL
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redis.on("connect", () => {
  console.log("Redis connected");
});

module.exports = redis;