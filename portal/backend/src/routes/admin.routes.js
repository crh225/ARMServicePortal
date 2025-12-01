/**
 * Admin Routes
 * Endpoints for admin operations like cache management
 */
import express from "express";
import { cache } from "../infrastructure/utils/Cache.js";

const router = express.Router();

/**
 * GET /api/admin/cache/stats
 * Get cache statistics (Redis + in-memory)
 */
router.get("/cache/stats", async (req, res) => {
  try {
    const stats = await cache.stats();
    res.json({
      success: true,
      stats,
      usingRedis: cache.isUsingRedis()
    });
  } catch (error) {
    console.error("[Admin] Failed to get cache stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache statistics"
    });
  }
});

/**
 * GET /api/admin/cache/entries
 * Get all cache entries with keys, values, and TTLs
 */
router.get("/cache/entries", async (req, res) => {
  try {
    const entries = await cache.getAll();

    // Calculate total size
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

    res.json({
      success: true,
      entries,
      count: entries.length,
      totalSize,
      usingRedis: cache.isUsingRedis()
    });
  } catch (error) {
    console.error("[Admin] Failed to get cache entries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache entries"
    });
  }
});

/**
 * DELETE /api/admin/cache/entries/:key
 * Delete a specific cache entry
 */
router.delete("/cache/entries/:key(*)", async (req, res) => {
  try {
    const { key } = req.params;
    await cache.delete(key);

    console.log(`[Admin] Cache entry deleted: ${key}`);

    res.json({
      success: true,
      message: `Cache entry '${key}' deleted`
    });
  } catch (error) {
    console.error("[Admin] Failed to delete cache entry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete cache entry"
    });
  }
});

/**
 * POST /api/admin/cache/clear
 * Clear all cache entries (Redis + in-memory)
 */
router.post("/cache/clear", async (req, res) => {
  try {
    // Get stats before clearing
    const statsBefore = await cache.stats();

    // Clear all cache
    await cache.clear();

    // Get stats after clearing
    const statsAfter = await cache.stats();

    console.log("[Admin] Cache cleared by admin request", {
      before: statsBefore,
      after: statsAfter
    });

    res.json({
      success: true,
      message: "Cache cleared successfully",
      cleared: {
        redis: statsBefore.redis?.keys || 0,
        memory: statsBefore.memory?.total || 0
      },
      usingRedis: cache.isUsingRedis()
    });
  } catch (error) {
    console.error("[Admin] Failed to clear cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache"
    });
  }
});

export default router;
