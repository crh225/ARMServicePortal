import { useMemo } from "react";
import { getResourceTypeDisplay } from "../components/resources/helpers.jsx";

/**
 * Get display cost - prefers actual cost, falls back to estimated
 * This is the same logic used in ResourceGraph for consistency
 */
function getDisplayCost(resource) {
  // Prefer actual cost if available
  if (resource.cost !== null && resource.cost !== undefined && resource.cost > 0) {
    return resource.cost;
  }
  // Fall back to estimated cost
  if (resource.estimatedMonthlyCost !== null && resource.estimatedMonthlyCost !== undefined && resource.estimatedMonthlyCost > 0) {
    return resource.estimatedMonthlyCost;
  }
  return 0;
}

/**
 * Custom hook to calculate cost summary with breakdowns
 * @param {Array} resources - Filtered resources to analyze
 * @returns {Object} Cost summary with breakdowns and statistics
 */
export function useCostSummary(resources) {
  return useMemo(() => {
    let totalCost = 0;
    let totalEstimatedCost = 0;
    let totalDisplayCost = 0; // Combined: actual if available, else estimated
    let resourcesWithCost = 0;
    let resourcesWithEstimatedCost = 0;
    let resourcesWithDisplayCost = 0;
    let resourcesNoCost = 0;
    const costByEnvironment = {};
    const costByBlueprint = {};
    const costByOwnership = {};
    const costByProduct = {};
    const estimatedCostByEnvironment = {};
    const estimatedCostByBlueprint = {};
    const estimatedCostByOwnership = {};
    const estimatedCostByProduct = {};
    const displayCostByEnvironment = {};
    const displayCostByBlueprint = {};
    const displayCostByOwnership = {};
    const displayCostByProduct = {};
    let highestCostResource = null;
    let highestCost = 0;
    let highestEstimatedCostResource = null;
    let highestEstimatedCost = 0;
    let highestDisplayCostResource = null;
    let highestDisplayCost = 0;

    resources.forEach(resource => {
      // Calculate display cost (actual if available, else estimated)
      const displayCost = getDisplayCost(resource);
      if (displayCost > 0) {
        totalDisplayCost += displayCost;
        resourcesWithDisplayCost++;

        // Track highest display cost resource
        if (displayCost > highestDisplayCost) {
          highestDisplayCost = displayCost;
          highestDisplayCostResource = resource;
        }

        // Breakdown by environment
        const env = resource.environment || "unknown";
        displayCostByEnvironment[env] = (displayCostByEnvironment[env] || 0) + displayCost;

        // Breakdown by blueprint
        const bp = resource.blueprintId || "unknown";
        displayCostByBlueprint[bp] = (displayCostByBlueprint[bp] || 0) + displayCost;

        // Breakdown by ownership status
        const status = resource.ownershipStatus || "unknown";
        displayCostByOwnership[status] = (displayCostByOwnership[status] || 0) + displayCost;

        // Breakdown by product (resource type)
        const product = getResourceTypeDisplay(resource.type);
        displayCostByProduct[product] = (displayCostByProduct[product] || 0) + displayCost;
      }

      // Actual cost (for backwards compatibility)
      if (resource.cost !== null && resource.cost !== undefined) {
        totalCost += resource.cost;
        resourcesWithCost++;

        // Track highest cost resource
        if (resource.cost > highestCost) {
          highestCost = resource.cost;
          highestCostResource = resource;
        }

        // Breakdown by environment
        const env = resource.environment || "unknown";
        costByEnvironment[env] = (costByEnvironment[env] || 0) + resource.cost;

        // Breakdown by blueprint
        const bp = resource.blueprintId || "unknown";
        costByBlueprint[bp] = (costByBlueprint[bp] || 0) + resource.cost;

        // Breakdown by ownership status
        const status = resource.ownershipStatus || "unknown";
        costByOwnership[status] = (costByOwnership[status] || 0) + resource.cost;

        // Breakdown by product (resource type)
        const product = getResourceTypeDisplay(resource.type);
        costByProduct[product] = (costByProduct[product] || 0) + resource.cost;
      }

      // Estimated monthly cost (for backwards compatibility)
      if (resource.estimatedMonthlyCost !== null && resource.estimatedMonthlyCost !== undefined) {
        totalEstimatedCost += resource.estimatedMonthlyCost;
        resourcesWithEstimatedCost++;

        // Track highest estimated cost resource
        if (resource.estimatedMonthlyCost > highestEstimatedCost) {
          highestEstimatedCost = resource.estimatedMonthlyCost;
          highestEstimatedCostResource = resource;
        }

        // Breakdown by environment
        const env = resource.environment || "unknown";
        estimatedCostByEnvironment[env] = (estimatedCostByEnvironment[env] || 0) + resource.estimatedMonthlyCost;

        // Breakdown by blueprint
        const bp = resource.blueprintId || "unknown";
        estimatedCostByBlueprint[bp] = (estimatedCostByBlueprint[bp] || 0) + resource.estimatedMonthlyCost;

        // Breakdown by ownership status
        const status = resource.ownershipStatus || "unknown";
        estimatedCostByOwnership[status] = (estimatedCostByOwnership[status] || 0) + resource.estimatedMonthlyCost;

        // Breakdown by product (resource type)
        const product = getResourceTypeDisplay(resource.type);
        estimatedCostByProduct[product] = (estimatedCostByProduct[product] || 0) + resource.estimatedMonthlyCost;
      }

      // Count resources without any cost info
      if ((resource.cost === null || resource.cost === undefined) &&
          (resource.estimatedMonthlyCost === null || resource.estimatedMonthlyCost === undefined)) {
        resourcesNoCost++;
      }
    });

    // Calculate average costs
    const avgCost = resourcesWithCost > 0 ? totalCost / resourcesWithCost : 0;
    const avgEstimatedCost = resourcesWithEstimatedCost > 0 ? totalEstimatedCost / resourcesWithEstimatedCost : 0;
    const avgDisplayCost = resourcesWithDisplayCost > 0 ? totalDisplayCost / resourcesWithDisplayCost : 0;

    // Sort breakdowns
    const topEnvironments = Object.entries(costByEnvironment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topBlueprints = Object.entries(costByBlueprint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topProducts = Object.entries(costByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const topEstimatedEnvironments = Object.entries(estimatedCostByEnvironment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topEstimatedBlueprints = Object.entries(estimatedCostByBlueprint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topEstimatedProducts = Object.entries(estimatedCostByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    // Sort display cost breakdowns (used for consistent display across views)
    const topDisplayEnvironments = Object.entries(displayCostByEnvironment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topDisplayBlueprints = Object.entries(displayCostByBlueprint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topDisplayProducts = Object.entries(displayCostByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    return {
      // Legacy fields (backwards compatibility)
      totalCost,
      totalEstimatedCost,
      avgCost,
      avgEstimatedCost,
      resourcesWithCost,
      resourcesWithEstimatedCost,
      resourcesNoCost,
      hasAnyCost: resourcesWithCost > 0,
      hasAnyEstimatedCost: resourcesWithEstimatedCost > 0,
      highestCostResource,
      highestEstimatedCostResource,
      topEnvironments,
      topBlueprints,
      topProducts,
      topEstimatedEnvironments,
      topEstimatedBlueprints,
      topEstimatedProducts,
      costByOwnership,
      estimatedCostByOwnership,
      // New unified display cost fields (prefers actual, falls back to estimated)
      totalDisplayCost,
      avgDisplayCost,
      resourcesWithDisplayCost,
      hasAnyDisplayCost: resourcesWithDisplayCost > 0,
      highestDisplayCostResource,
      topDisplayEnvironments,
      topDisplayBlueprints,
      topDisplayProducts,
      displayCostByOwnership
    };
  }, [resources]);
}
