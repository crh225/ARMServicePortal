/**
 * Redis Client with connection pooling and fallback to in-memory cache
 * Connects to Kubernetes Redis service when REDIS_URL is set
 */
import Redis from "ioredis";

// Connection state
let redis = null;
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

/**
 * Get Redis connection URL from environment
 * Default: redis-xp1-dev-redis.redis-xp1-dev.svc.cluster.local:6379
 */
function getRedisUrl() {
  return process.env.REDIS_URL || "redis://redis-xp1-dev-redis.redis-xp1-dev.svc.cluster.local:6379";
}

/**
 * Initialize Redis connection with retry logic
 */
export async function initRedis() {
  if (redis && isConnected) {
    return redis;
  }

  const redisUrl = getRedisUrl();

  // Skip Redis in local development if not configured
  if (!process.env.REDIS_URL && process.env.NODE_ENV !== "production") {
    console.log("[Redis] No REDIS_URL configured, using in-memory cache");
    return null;
  }

  try {
    connectionAttempts++;
    console.log(`[Redis] Connecting to ${redisUrl} (attempt ${connectionAttempts}/${MAX_RETRIES})`);

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > MAX_RETRIES) {
          console.warn("[Redis] Max retries reached, falling back to in-memory cache");
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    // Event handlers
    redis.on("connect", () => {
      isConnected = true;
      connectionAttempts = 0;
      console.log("[Redis] Connected successfully");
    });

    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
      isConnected = false;
    });

    redis.on("close", () => {
      console.log("[Redis] Connection closed");
      isConnected = false;
    });

    redis.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...");
    });

    // Attempt connection
    await redis.connect();
    return redis;
  } catch (error) {
    console.error("[Redis] Failed to connect:", error.message);
    isConnected = false;
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
