/**
 * Feature Flag Service
 * Client-side service for checking feature flags from Azure App Configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Cache for feature flag states
const flagCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache on client side

/**
 * Feature Flag Service
 */
const featureFlagService = {
  /**
   * Fetch all feature flags
   * @returns {Promise<Array>} Array of feature flags
   */
  async fetchAllFlags() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/features`);
      if (!response.ok) {
        console.warn("[FeatureFlags] Failed to fetch flags:", response.status);
        return [];
      }
      const flags = await response.json();

      // Update cache with all flags
      flags.forEach((flag) => {
        flagCache.set(flag.key, {
          value: flag,
          timestamp: Date.now(),
        });
      });

      return flags;
    } catch (error) {
      console.error("[FeatureFlags] Error fetching all flags:", error);
      return [];
    }
  },

  /**
   * Check if a feature is enabled
   * @param {string} featureKey - The feature flag key
   * @param {object} context - Optional context for targeting
   * @returns {Promise<boolean>} True if enabled
   */
  async isEnabled(featureKey, context = {}) {
    // Check cache first
    const cached = flagCache.get(`enabled:${featureKey}`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    try {
      const url = new URL(`${API_BASE_URL}/api/features/${featureKey}/enabled`);

      // Add context as query params
      if (context.userId) url.searchParams.set("userId", context.userId);
      if (context.groups) url.searchParams.set("groups", context.groups.join(","));
      if (context.sessionId) url.searchParams.set("sessionId", context.sessionId);

      const response = await fetch(url);
      if (!response.ok) {
        // If flag doesn't exist, default to disabled
        return false;
      }

      const result = await response.json();
      const enabled = result.enabled ?? false;

      // Cache the result
      flagCache.set(`enabled:${featureKey}`, {
        value: enabled,
        timestamp: Date.now(),
      });

      return enabled;
    } catch (error) {
      console.error(`[FeatureFlags] Error checking ${featureKey}:`, error);
      return false;
    }
  },

  /**
   * Check multiple features at once (batch)
   * @param {Array<string>} features - Array of feature keys
   * @param {object} context - Optional context for targeting
   * @returns {Promise<object>} Object mapping feature keys to enabled status
   */
  async batchCheck(features, context = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/features/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, context }),
      });

      if (!response.ok) {
        // Return all features as disabled on error
        return features.reduce((acc, key) => ({ ...acc, [key]: false }), {});
      }

      const results = await response.json();

      // Update cache
      Object.entries(results).forEach(([key, enabled]) => {
        flagCache.set(`enabled:${key}`, {
          value: enabled,
          timestamp: Date.now(),
        });
      });

      return results;
    } catch (error) {
      console.error("[FeatureFlags] Error in batch check:", error);
      return features.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    }
  },

  /**
   * Clear the local cache
   */
  clearCache() {
    flagCache.clear();
  },

  /**
   * Get a cached flag value without making API call
   * @param {string} featureKey - The feature flag key
   * @returns {boolean|null} Cached value or null if not cached
   */
  getCached(featureKey) {
    const cached = flagCache.get(`enabled:${featureKey}`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }
    return null;
  },
};

export default featureFlagService;
