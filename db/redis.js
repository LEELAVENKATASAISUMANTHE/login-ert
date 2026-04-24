import Redis from "ioredis";
import logger from "../utils/logger.js";

// Use REDIS_URL env var (set in docker-compose), fallback for local dev
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    logger.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },
  lazyConnect: true,            // don't auto-connect, we'll call .connect() manually
  enableReadyCheck: true,
});

redis.on("connect", () => {
  logger.info("✅ Redis TCP connection established");
});

redis.on("ready", () => {
  logger.info("✅ Redis is ready to accept commands");
});

redis.on("error", (err) => {
  logger.error({ error: err.message }, "❌ Redis error");
});

redis.on("close", () => {
  logger.warn("⚠️  Redis connection closed");
});

/**
 * Explicitly connect to Redis — call this during server startup.
 * Returns true if connected, false otherwise (app can still run without Redis).
 */
export async function connectRedis() {
  try {
    await redis.connect();
    // ping to verify
    const pong = await redis.ping();
    logger.info("✅ Redis PING → " + pong);
    return true;
  } catch (err) {
    logger.error({
      url: REDIS_URL,
      error: err.message,
    }, "❌ Redis connection failed");
    logger.warn("⚠️  Application will continue without Redis");
    return false;
  }
}