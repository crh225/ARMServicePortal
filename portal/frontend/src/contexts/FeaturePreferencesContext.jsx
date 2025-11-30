import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "portal-feature-preferences";

const FeaturePreferencesContext = createContext(null);

/**
 * Provider for user feature preferences
 * Stores preferences in localStorage for persistence
 */
export function FeaturePreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage when preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage errors
    }
  }, [preferences]);

  /**
   * Check if a feature is enabled by user preference
   * Returns undefined if no preference set (use server flag)
   */
  const isFeatureEnabled = useCallback((featureKey) => {
    return preferences[featureKey];
  }, [preferences]);

  /**
   * Get feature preference with fallback to default (e.g., server flag)
   * Use this when you want the server flag as the default
   */
  const getFeatureEnabled = useCallback((featureKey, defaultValue) => {
    return preferences[featureKey] !== undefined ? preferences[featureKey] : defaultValue;
  }, [preferences]);

  /**
   * Set user preference for a feature
   */
  const setFeatureEnabled = useCallback((featureKey, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [featureKey]: enabled
    }));
  }, []);

  /**
   * Toggle a feature preference
   */
  const toggleFeature = useCallback((featureKey) => {
    setPreferences(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  }, []);

  /**
   * Clear a user preference (revert to server flag)
   */
  const clearPreference = useCallback((featureKey) => {
    setPreferences(prev => {
      const next = { ...prev };
      delete next[featureKey];
      return next;
    });
  }, []);

  const value = {
    preferences,
    isFeatureEnabled,
    getFeatureEnabled,
    setFeatureEnabled,
    toggleFeature,
    clearPreference
  };

  return (
    <FeaturePreferencesContext.Provider value={value}>
      {children}
    </FeaturePreferencesContext.Provider>
  );
}

/**
 * Hook to access feature preferences
 */
export function useFeaturePreferences() {
  const context = useContext(FeaturePreferencesContext);
  if (!context) {
    throw new Error("useFeaturePreferences must be used within FeaturePreferencesProvider");
  }
  return context;
}

export default FeaturePreferencesContext;
