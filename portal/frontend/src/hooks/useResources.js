import { useState, useCallback } from "react";
import { fetchAllResources } from "../services/resourcesApi";

/**
 * Ownership states for resources
 */
export const OwnershipStatus = {
  MANAGED: "managed",     // Tag exists + matching PR found
  STALE: "stale",         // Tag exists but PR was closed/cancelled
  ORPHAN: "orphan",       // Tagged resource but PR not found
  UNMANAGED: "unmanaged"  // No armportal-* tags at all
};

/**
 * Compute ownership status for a resource
 * @param {object} resource - Enriched resource from backend
 * @returns {string} Ownership status
 */
function computeOwnershipStatus(resource) {
  const hasArmPortalTag = resource.tags &&
    Object.keys(resource.tags).some(key => key.startsWith("armportal"));

  if (!hasArmPortalTag) {
    return OwnershipStatus.UNMANAGED;
  }

  if (!resource.pr) {
    return OwnershipStatus.ORPHAN;
  }

  // Check if PR is closed or cancelled
  if (resource.pr.status === "closed" && !resource.pr.merged) {
    return OwnershipStatus.STALE;
  }

  return OwnershipStatus.MANAGED;
}

/**
 * Custom hook for managing Azure resources
 * Uses backend API (which has managed identity for Azure Resource Graph)
 */
export function useResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch resources from backend
   */
  const fetchResources = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from backend (backend handles Azure auth and GitHub enrichment)
      const response = await fetchAllResources(options);

      // Compute ownership status for each resource
      const enrichedResources = response.resources.map(resource => ({
        ...resource,
        ownershipStatus: computeOwnershipStatus(resource),
        // Placeholder for future cost feature
        cost: null
        // health is already provided by backend
      }));

      setResources(enrichedResources);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh resources
   */
  const refreshResources = useCallback(() => {
    return fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    fetchResources,
    refreshResources
  };
}
