/**
 * Interface for Feature Flag Service
 * Provides methods for retrieving and evaluating feature flags from Azure App Configuration
 */
export class IFeatureFlagService {
  /**
   * Get a specific feature flag by key
   * @param {string} featureKey - The feature flag key
   * @returns {Promise<object|null>} The feature flag configuration or null
   */
  async getFeatureFlag(featureKey) {
    throw new Error("getFeatureFlag() must be implemented");
  }

  /**
   * Get all feature flags
   * @returns {Promise<Array>} Array of feature flag configurations
   */
  async getAllFeatureFlags() {
    throw new Error("getAllFeatureFlags() must be implemented");
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureKey - The feature flag key
   * @param {object} context - Optional context for targeting (user, environment, etc.)
   * @returns {Promise<boolean>} True if the feature is enabled
   */
  async isFeatureEnabled(featureKey, context = {}) {
    throw new Error("isFeatureEnabled() must be implemented");
  }

  /**
   * Refresh the feature flag cache
   * @returns {Promise<void>}
   */
  async refreshCache() {
    throw new Error("refreshCache() must be implemented");
  }
}
