// config/redis.ts
import Redis, { RedisOptions } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable not set");
}

console.log("🔄 Connecting to Redis...");
console.log(
  "📍 Redis URL (first 30 chars):",
  redisUrl.substring(0, 30) + "..."
);

const options: RedisOptions = {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  lazyConnect: true,
  keepAlive: 30000,
};

const connection = new Redis(redisUrl, options);

export default connection;
