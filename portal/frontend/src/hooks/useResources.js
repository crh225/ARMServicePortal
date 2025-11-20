import { useState, useCallback } from "react";
import { fetchAllResources } from "../services/resourcesApi";

/**
 * Ownership states for resources
 */
export const OwnershipStatus = {
  MANAGED: "managed",     // Tag exists + matching PR found
  PERMANENT: "permanent", // Tag exists with request-id = "permanent" (foundational infrastructure)
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

  // Check for permanent infrastructure (foundational resources like state backends)
  const requestId = resource.tags?.["armportal-request-id"];
  if (requestId === "permanent") {
    return OwnershipStatus.PERMANENT;
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
  const [costsLoading, setCostsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch resources from backend (progressive loading)
   * First loads resources quickly without costs, then patches costs in
   */
  const fetchResources = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Phase 1: Fetch resources WITHOUT costs (fast - loads grid immediately)
      const response = await fetchAllResources(options);

      // Compute ownership status for each resource
      const enrichedResources = response.resources.map(resource => ({
        ...resource,
        ownershipStatus: computeOwnershipStatus(resource)
        // cost and health are already provided by backend
      }));

      // Show resources immediately
      setResources(enrichedResources);
      setLoading(false);

      // Phase 2: Fetch costs separately and patch them in (slower, updates grid progressively)
      setCostsLoading(true);
      const costResponse = await fetchAllResources({ ...options, includeCosts: true });

      // Update resources with cost data
      const resourcesWithCosts = enrichedResources.map(resource => {
        const resourceWithCost = costResponse.resources.find(r => r.id === resource.id);
        return {
          ...resource,
          cost: resourceWithCost?.cost !== undefined ? resourceWithCost.cost : null
        };
      });

      setResources(resourcesWithCosts);
      setCostsLoading(false);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setError(err.message);
      setLoading(false);
      setCostsLoading(false);
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
    costsLoading,
    error,
    fetchResources,
    refreshResources
  };
}
