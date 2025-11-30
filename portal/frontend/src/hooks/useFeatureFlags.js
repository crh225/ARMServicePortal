import { useState, useEffect, useCallback, useRef } from "react";
import featureFlagService from "../services/featureFlagService";

/**
 * Custom hook for feature flag management
 * Provides easy access to feature flag states with automatic caching and refresh
 *
 * @param {object} options - Configuration options
 * @param {Array<string>} options.features - Array of feature keys to monitor
 * @param {object} options.context - Optional context for targeting (userId, groups, etc.)
 * @param {number} options.refreshInterval - Refresh interval in ms (default: 60000)
 * @returns {object} Feature flag states and utilities
 *
 * @example
 * const { isEnabled, loading, refresh } = useFeatureFlags({
 *   features: ['notifications', 'dark-mode'],
 *   context: { userId: 'user123' }
 * });
 *
 * if (isEnabled('notifications')) {
 *   // Show notifications feature
 * }
 */
function useFeatureFlags(options = {}) {
  const {
    features = [],
    context = {},
    refreshInterval = 60000, // 1 minute default
  } = options;

  // State for all flag values
  const [flags, setFlags] = useState(() => {
    // Initialize from cache if available
    const initial = {};
    features.forEach((key) => {
      const cached = featureFlagService.getCached(key);
      initial[key] = cached !== null ? cached : false;
    });
    return initial;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);
  const contextRef = useRef(context);

  // Update context ref when it changes
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  /**
   * Fetch feature flags from API
   */
  const fetchFlags = useCallback(async () => {
    if (features.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Use batch API for efficiency
      const results = await featureFlagService.batchCheck(features, contextRef.current);

      setFlags(results);
    } catch (err) {
      console.error("[useFeatureFlags] Error fetching flags:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [features]);

  /**
   * Check if a specific feature is enabled
   */
  const isEnabled = useCallback(
    (featureKey) => {
      return flags[featureKey] ?? false;
    },
    [flags]
  );

  /**
   * Manually refresh feature flags
   */
  const refresh = useCallback(() => {
    featureFlagService.clearCache();
    return fetchFlags();
  }, [fetchFlags]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchFlags();

    // Set up polling for refresh
    if (refreshInterval > 0) {
      refreshTimer.current = setInterval(fetchFlags, refreshInterval);
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [fetchFlags, refreshInterval]);

  // Handle visibility change (pause/resume polling)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
          refreshTimer.current = null;
        }
      } else {
        // Refresh immediately when tab becomes visible
        fetchFlags();
        if (refreshInterval > 0) {
          refreshTimer.current = setInterval(fetchFlags, refreshInterval);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFlags, refreshInterval]);

  return {
    /** All flag states as an object */
    flags,
    /** Check if a specific feature is enabled */
    isEnabled,
    /** Loading state */
    loading,
    /** Error message if any */
    error,
    /** Manually refresh all flags */
    refresh,
  };
}

/**
 * Simple hook to check a single feature flag
 * @param {string} featureKey - The feature key to check
 * @param {object} options - Options object
 * @param {boolean} options.defaultValue - Default value if flag is not found (default: true)
 * @param {object} options.context - Optional targeting context
 * @returns {boolean} Whether the feature is enabled
 *
 * @example
 * const notificationsEnabled = useFeatureFlag('notifications');
 * const betaFeature = useFeatureFlag('beta-feature', { defaultValue: false });
 */
export function useFeatureFlag(featureKey, options = {}) {
  const { defaultValue = true, context = {} } = options;

  const { isEnabled, loading, error } = useFeatureFlags({
    features: [featureKey],
    context,
  });

  // Return default value while loading or on error, then the actual value
  if (loading || error) {
    return defaultValue;
  }

  // If flag explicitly exists and is set, use that value
  // Otherwise return the default value
  const flagValue = isEnabled(featureKey);
  return flagValue !== undefined ? flagValue : defaultValue;
}

export default useFeatureFlags;
