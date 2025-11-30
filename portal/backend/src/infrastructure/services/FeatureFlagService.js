/**
 * Feature Flag Service Implementation
 * Retrieves feature flags from Azure App Configuration
 */
import { AppConfigurationClient } from "@azure/app-configuration";
import { DefaultAzureCredential } from "@azure/identity";
import { IFeatureFlagService } from "../../domain/services/IFeatureFlagService.js";
import { cache } from "../utils/Cache.js";

// Cache TTL for feature flags (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY_PREFIX = "feature-flags:";
const CACHE_ALL_FLAGS_KEY = "feature-flags:all";

export class FeatureFlagService extends IFeatureFlagService {
  constructor() {
    super();
    this.client = null;
    this.initialized = false;
    this.endpoint = process.env.AZURE_APP_CONFIG_ENDPOINT;
  }

  /**
   * Initialize the App Configuration client
   */
  async init() {
    if (this.initialized) return;

    if (!this.endpoint) {
      console.warn("[FeatureFlagService] AZURE_APP_CONFIG_ENDPOINT not set, feature flags disabled");
      this.initialized = true;
      return;
    }

    try {
      const credential = new DefaultAzureCredential();
      this.client = new AppConfigurationClient(this.endpoint, credential);
      this.initialized = true;
      console.log("[FeatureFlagService] Connected to Azure App Configuration:", this.endpoint);
    } catch (error) {
      console.error("[FeatureFlagService] Failed to initialize:", error.message);
      this.initialized = true;
    }
  }

  /**
   * Parse feature flag value from App Configuration format
   * Feature flags in Azure App Config are stored with .appconfig.featureflag/ prefix
   */
  parseFeatureFlag(setting) {
    try {
      const value = JSON.parse(setting.value);
      return {
        key: setting.key.replace(".appconfig.featureflag/", ""),
        enabled: value.enabled ?? false,
        description: value.description || "",
        conditions: value.conditions || {},
        lastModified: setting.lastModified,
      };
    } catch {
      return {
        key: setting.key,
        enabled: false,
        description: "",
        conditions: {},
        lastModified: setting.lastModified,
      };
    }
  }

  /**
   * Get a specific feature flag by key
   */
  async getFeatureFlag(featureKey) {
    await this.init();

    if (!this.client) {
      return null;
    }

    // Check cache first
    const cacheKey = CACHE_KEY_PREFIX + featureKey;
    const cached = await cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Feature flags have a special key format in Azure App Configuration
      const setting = await this.client.getConfigurationSetting({
        key: `.appconfig.featureflag/${featureKey}`,
      });

      const flag = this.parseFeatureFlag(setting);
      await cache.set(cacheKey, flag, CACHE_TTL_MS);
      return flag;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`[FeatureFlagService] Error getting flag ${featureKey}:`, error.message || error.code || error);
      return null;
    }
  }

  /**
   * Get all feature flags
   */
  async getAllFeatureFlags() {
    await this.init();

    if (!this.client) {
      return [];
    }

    // Check cache first
    const cached = await cache.get(CACHE_ALL_FLAGS_KEY);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const flags = [];
      // Feature flags have a special key selector in Azure App Configuration
      const settings = this.client.listConfigurationSettings({
        keyFilter: ".appconfig.featureflag/*",
      });

      for await (const setting of settings) {
        flags.push(this.parseFeatureFlag(setting));
      }

      await cache.set(CACHE_ALL_FLAGS_KEY, flags, CACHE_TTL_MS);
      return flags;
    } catch (error) {
      console.error("[FeatureFlagService] Error getting all flags:", error.message);
      return [];
    }
  }

  /**
   * Check if a feature is enabled
   * Supports basic targeting based on context
   */
  async isFeatureEnabled(featureKey, context = {}) {
    const flag = await this.getFeatureFlag(featureKey);

    if (!flag) {
      // Default to disabled if flag doesn't exist
      return false;
    }

    // Simple enabled check
    if (!flag.enabled) {
      return false;
    }

    // Check targeting conditions if they exist
    if (flag.conditions?.client_filters?.length > 0) {
      return this.evaluateConditions(flag.conditions, context);
    }

    return flag.enabled;
  }

  /**
   * Evaluate targeting conditions
   */
  evaluateConditions(conditions, context) {
    const filters = conditions.client_filters || [];

    for (const filter of filters) {
      if (filter.name === "Microsoft.Targeting") {
        return this.evaluateTargetingFilter(filter.parameters, context);
      }
      if (filter.name === "Microsoft.Percentage") {
        return this.evaluatePercentageFilter(filter.parameters, context);
      }
    }

    // If no filters matched, default to enabled
    return true;
  }

  /**
   * Evaluate targeting filter (users, groups, default percentage)
   */
  evaluateTargetingFilter(params, context) {
    // Check specific users
    if (params.Users && context.userId) {
      if (params.Users.includes(context.userId)) {
        return true;
      }
    }

    // Check groups
    if (params.Groups && context.groups) {
      for (const group of params.Groups) {
        if (context.groups.includes(group.Name)) {
          // Apply group rollout percentage
          const hash = this.hashString(`${context.userId || ""}:${group.Name}`);
          if (hash % 100 < group.RolloutPercentage) {
            return true;
          }
        }
      }
    }

    // Apply default rollout percentage
    if (params.DefaultRolloutPercentage !== undefined) {
      const hash = this.hashString(context.userId || context.sessionId || "default");
      return hash % 100 < params.DefaultRolloutPercentage;
    }

    return false;
  }

  /**
   * Evaluate percentage filter
   */
  evaluatePercentageFilter(params, context) {
    const percentage = params.Value || 0;
    const hash = this.hashString(context.userId || context.sessionId || "default");
    return hash % 100 < percentage;
  }

  /**
   * Simple string hash for consistent percentage rollout
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Refresh the feature flag cache
   */
  async refreshCache() {
    // Clear cached flags
    await cache.delete(CACHE_ALL_FLAGS_KEY);

    // Get all flags to repopulate cache
    const flags = await this.getAllFeatureFlags();

    // Also update individual flag caches
    for (const flag of flags) {
      await cache.set(CACHE_KEY_PREFIX + flag.key, flag, CACHE_TTL_MS);
    }

    console.log(`[FeatureFlagService] Cache refreshed with ${flags.length} flags`);
    return flags;
  }

  /**
   * Check if the service is configured and available
   */
  isAvailable() {
    return this.client !== null;
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();
