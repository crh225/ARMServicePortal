/**
 * Unified Cache with Redis support and in-memory fallback
 * Uses Redis when available (K8s), falls back to in-memory for local dev
 */
import redisClient from "./RedisClient.js";

// In-memory fallback store
const memoryStore = new Map();

// Key prefix for Redis to avoid collisions
const KEY_PREFIX = "armportal:";

/**
 * Cache class with Redis and in-memory support
 */
class Cache {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize cache (attempts Redis connection)
   */
  async init() {
    if (this.initialized) return;

    try {
      await redisClient.init();
      this.initialized = true;
      console.log("[Cache] Initialized", redisClient.isAvailable() ? "with Redis" : "with in-memory fallback");
    } catch (error) {
      console.warn("[Cache] Redis init failed, using in-memory:", error.message);
      this.initialized = true;
    }
  }

  /**
   * Set a cache entry with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache (will be JSON serialized for Redis)
   * @param {number} ttlMs - Time to live in milliseconds
   */
  async set(key, value, ttlMs) {
    const prefixedKey = KEY_PREFIX + key;
    const redis = redisClient.get();

    if (redis) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await redis.setex(prefixedKey, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn("[Cache] Redis set failed, using memory:", error.message);
      }
    }

    // Fallback to in-memory
    const expiresAt = Date.now() + ttlMs;
    memoryStore.set(key, { value, expiresAt });
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or undefined if not found/expired
   */
  async get(key) {
    const prefixedKey = KEY_PREFIX + key;
    const redis = redisClient.get();

    if (redis) {
      try {
        const data = await redis.get(prefixedKey);
        if (data) {
          return JSON.parse(data);
        }
        return undefined;
      } catch (error) {
        console.warn("[Cache] Redis get failed, trying memory:", error.message);
      }
    }

    // Fallback to in-memory
    const entry = memoryStore.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    const prefixedKey = KEY_PREFIX + key;
    const redis = redisClient.get();

    if (redis) {
      try {
        await redis.del(prefixedKey);
      } catch (error) {
        console.warn("[Cache] Redis delete failed:", error.message);
      }
    }

    memoryStore.delete(key);
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear() {
    const redis = redisClient.get();

    if (redis) {
      try {
        const keys = await redis.keys(KEY_PREFIX + "*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.warn("[Cache] Redis clear failed:", error.message);
      }
    }

    memoryStore.clear();
  }

  /**
   * Get cache statistics
   */
  async stats() {
    const redis = redisClient.get();
    let redisStats = null;

    if (redis) {
      try {
        const keys = await redis.keys(KEY_PREFIX + "*");
        redisStats = {
          keys: keys.length,
          connected: true,
        };
      } catch (error) {
        redisStats = { connected: false, error: error.message };
      }
    }

    // Memory stats
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of memoryStore) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      redis: redisStats,
      memory: {
        total: memoryStore.size,
        valid: validEntries,
        expired: expiredEntries,
      },
    };
  }

  /**
   * Clean up expired entries (memory only - Redis handles this automatically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now > entry.expiresAt) {
        memoryStore.delete(key);
      }
    }
  }

  /**
   * Check if Redis is being used
   */
  isUsingRedis() {
    return redisClient.isAvailable();
  }
}

// Export singleton instance
export const cache = new Cache();

// Run memory cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
  cache.stats().then((stats) => {
    console.log("[Cache] Cleanup complete. Stats:", stats);
  });
}, 5 * 60 * 1000);

// Initialize cache on module load
cache.init().catch((err) => {
  console.warn("[Cache] Auto-init failed:", err.message);
});
