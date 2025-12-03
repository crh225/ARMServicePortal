/**
 * Redis Client with automatic reconnection
 * Connects to Kubernetes Redis service when REDIS_URL is set
 * Uses ioredis native auto-reconnect - never gives up
 */
import Redis from "ioredis";

// Connection state
let redis = null;
let isConnected = false;

/**
 * Get Redis connection URL from environment
 */
function getRedisUrl() {
  return process.env.REDIS_URL || "redis://redis-xp1-dev-redis.redis-xp1-dev.svc.cluster.local:6379";
}

/**
 * Initialize Redis connection
 * ioredis handles reconnection automatically - we just need to not return null from retryStrategy
 */
export async function initRedis() {
  if (redis && isConnected) {
    return redis;
  }

  // Skip Redis in local development if not configured
  if (!process.env.REDIS_URL && process.env.NODE_ENV !== "production") {
    console.log("[Redis] No REDIS_URL configured, using in-memory cache");
    return null;
  }

  const redisUrl = getRedisUrl();
  console.log(`[Redis] Connecting to ${redisUrl}`);

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Never fail commands, wait for reconnection
    retryStrategy: (times) => {
      // Always return a delay - never give up reconnecting
      const delay = Math.min(times * 500, 30000); // Max 30s between retries
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    connectTimeout: 10000,
    lazyConnect: true,
  });

  redis.on("connect", () => {
    isConnected = true;
    console.log("[Redis] Connected successfully");
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  redis.on("close", () => {
    console.log("[Redis] Connection closed");
    isConnected = false;
  });

  redis.on("reconnecting", (delay) => {
    console.log(`[Redis] Reconnecting in ${delay}ms...`);
  });

  try {
    await redis.connect();
    return redis;
  } catch (error) {
    console.error("[Redis] Initial connection failed:", error.message);
    // Don't null out redis - ioredis will keep trying to reconnect
    return null;
  }
}

/**
 * Get the Redis client (or null if not connected)
 */
export function getRedis() {
  return isConnected ? redis : null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable() {
  return isConnected && redis !== null;
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
  if (redis) {
    console.log("[Redis] Closing connection...");
    await redis.quit();
    redis = null;
    isConnected = false;
  }
}

// Export singleton
export default {
  init: initRedis,
  get: getRedis,
  isAvailable: isRedisAvailable,
  close: closeRedis,
};
