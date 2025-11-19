/**
 * Resources Controller
 * Handles Azure Resource Graph queries and resource enrichment
 */

import { queryArmPortalResources, queryResourcesByRequestId } from "../services/azureResourceGraph.js";
import { getGitHubRequestByNumber, findPRByModuleName } from "../services/github/pullRequests.js";
import { getSubscriptionCosts } from "../services/costService.js";

/**
 * Extract PR numbers from resources
 */
function extractPRNumbers(resources) {
  const prNumbers = new Set();
  const stackRequestIds = new Set();

  resources.forEach(resource => {
    const requestId = resource.tags?.["armportal-request-id"];
    if (requestId) {
      const prNumber = parseInt(requestId, 10);
      if (!isNaN(prNumber)) {
        prNumbers.add(prNumber);
      } else {
        // If it's not a number, it might be a stack component ID or module name
        // Store it to look up the PR from the infra repo
        stackRequestIds.add(requestId);
      }
    }
  });

  return {
    prNumbers: Array.from(prNumbers),
    stackRequestIds: Array.from(stackRequestIds)
  };
}

/**
 * Enrich resources with GitHub PR data and optionally cost information
 * @param {Array} resources - Resources to enrich
 * @param {boolean} includeCosts - Whether to fetch cost data (default: false for faster response)
 */
async function enrichResourcesWithPRs(resources, includeCosts = false) {
  const { prNumbers, stackRequestIds } = extractPRNumbers(resources);

  // Fetch all PRs in parallel
  const prPromises = prNumbers.map(prNumber =>
    getGitHubRequestByNumber(prNumber)
      .then(pr => ({ prNumber, pr }))
      .catch(() => ({ prNumber, pr: null }))
  );

  const prResults = await Promise.all(prPromises);
  const prMap = new Map(prResults.map(({ prNumber, pr }) => [prNumber, pr]));

  // For stack request IDs, look up the PR that created each module
  const stackRequestIdMap = new Map();

  // Look up PRs for stack components in parallel
  const stackPrPromises = stackRequestIds.map(async requestId => {
    try {
      // Extract base module name (remove component suffix if present)
      // e.g., "azure-webapp-stack_5b0d160a_rg" -> "azure-webapp-stack_5b0d160a"
      const baseModuleName = requestId.includes('_')
        ? requestId.split('_').slice(0, -1).join('_')  // Remove last component
        : requestId;

      const pr = await findPRByModuleName(baseModuleName);
      return { requestId, pr };
    } catch (error) {
      console.error(`Failed to find PR for stack component ${requestId}:`, error);
      return { requestId, pr: null };
    }
  });

  const stackPrResults = await Promise.all(stackPrPromises);
  stackPrResults.forEach(({ requestId, pr }) => {
    stackRequestIdMap.set(requestId, pr);
  });

  // Optionally fetch costs (disabled by default for faster initial load)
  let allCostsMap = new Map();
  let allRgTotals = new Map();

  if (includeCosts) {
    // Get unique subscriptions for cost queries
    const subscriptions = new Set();
    resources.forEach(resource => {
      if (resource.subscriptionId) {
        subscriptions.add(resource.subscriptionId);
      }
    });

    // Fetch costs for each subscription (more efficient, avoids rate limiting)
    const costPromises = Array.from(subscriptions).map(async subscriptionId => {
      const result = await getSubscriptionCosts(subscriptionId);
      console.log(`Cost query for subscription ${subscriptionId}: ${result.costMap.size} resources, ${result.rgTotals.size} RGs`);
      return { subscriptionId, costMap: result.costMap, rgTotals: result.rgTotals };
    });

    const costResults = await Promise.all(costPromises);

    costResults.forEach(({ subscriptionId, costMap, rgTotals }) => {
      // Store per-resource costs
      costMap.forEach((cost, resourceId) => {
        allCostsMap.set(resourceId, cost);
      });
      // Store RG totals with subscription prefix
      rgTotals.forEach((cost, rgName) => {
        const key = `${subscriptionId}|${rgName}`;
        console.log(`Storing RG cost for key "${key}": $${cost}`);
        allRgTotals.set(key, cost);
      });
    });
  }

  // Enrich each resource
  return resources.map(resource => {
    const requestId = resource.tags?.["armportal-request-id"];
    const prNumber = requestId ? parseInt(requestId, 10) : null;

    // Try to get PR from direct PR number map, or from stack request ID map
    let pr = null;
    if (prNumber && !isNaN(prNumber)) {
      pr = prMap.get(prNumber);
    } else if (requestId && stackRequestIdMap.has(requestId)) {
      pr = stackRequestIdMap.get(requestId);
    }

    // Extract health/provisioning state from properties
    // Note: Resource Groups and subscriptions don't have provisioningState
    let provisioningState = null;
    let health = null;

    const resourceType = (resource.type || "").toLowerCase();
    const isResourceGroup = resourceType === "microsoft.resources/resourcegroups";

    if (resourceType !== "microsoft.resources/subscriptions" && !isResourceGroup) {
      provisioningState = resource.properties?.provisioningState || null;
      health = provisioningState;
    }

    // Get cost for this resource
    let cost = null;
    if (isResourceGroup) {
      // For Resource Groups, use the total cost of all resources in that RG
      const rgKey = `${resource.subscriptionId}|${resource.name}`;
      cost = allRgTotals.get(rgKey);
      // If we have cost data (even if 0), set it. Otherwise leave as null.
      if (cost !== undefined) {
        cost = cost || 0; // Ensure 0 is shown as 0, not null
      } else {
        cost = null; // No data available
      }
    } else {
      // For regular resources, look up individual cost
      const resourceCost = allCostsMap.get(resource.id.toLowerCase());
      if (resourceCost !== undefined) {
        cost = resourceCost || 0; // If cost is 0, show 0 (not null)
      } else {
        cost = null; // No cost data available
      }
    }

    return {
      // Resource data
      id: resource.id,
      name: resource.name,
      type: resource.type,
      location: resource.location,
      resourceGroup: resource.resourceGroup,
      subscriptionId: resource.subscriptionId,
      tags: resource.tags || {},
      properties: resource.properties || {},

      // Extracted metadata
      environment: resource.tags?.["armportal-environment"] || null,
      blueprintId: resource.tags?.["armportal-blueprint"] || null,
      requestId: resource.tags?.["armportal-request-id"] || null,
      owner: resource.tags?.["armportal-owner"] || null,

      // Health information
      health,
      provisioningState,

      // Cost information (last 30 days in USD)
      cost,

      // Enriched data
      prNumber,
      pr
    };
  });
}

/**
 * GET /api/resources
 * Get all ARM Portal resources with GitHub enrichment
 * Supports filtering by environment, blueprintId, resourceGroup, subscriptions
 * Supports pagination with skip and top parameters
 */
export async function getResources(req, res) {
  try {
    const {
      environment,
      blueprintId,
      resourceGroup,
      subscriptions,
      skip,
      top,
      includeCosts
    } = req.query;

    const options = {};
    if (environment) options.environment = environment;
    if (blueprintId) options.blueprintId = blueprintId;
    if (resourceGroup) options.resourceGroup = resourceGroup;
    if (subscriptions) {
      // Parse subscriptions if provided as comma-separated string
      options.subscriptions = subscriptions.split(",").map(s => s.trim());
    }

    // Parse includeCosts parameter (default: false for faster initial load)
    const shouldIncludeCosts = includeCosts === 'true';

    // Parse pagination parameters
    if (skip) {
      const skipNum = parseInt(skip, 10);
      if (!isNaN(skipNum) && skipNum >= 0) {
        options.skip = skipNum;
      }
    }

    if (top) {
      const topNum = parseInt(top, 10);
      if (!isNaN(topNum) && topNum > 0 && topNum <= 1000) {
        options.top = topNum;
      }
    }

    // Query Azure Resource Graph
    const resources = await queryArmPortalResources(options);

    // Enrich with GitHub PR data and optionally costs
    const enrichedResources = await enrichResourcesWithPRs(resources, shouldIncludeCosts);

    // Note: Azure Resource Graph doesn't provide total count easily
    // We return the count of returned resources
    // For true total count, would need a separate count query
    res.json({
      resources: enrichedResources,
      count: enrichedResources.length,
      skip: options.skip || 0,
      top: options.top || 1000
    });
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    res.status(500).json({
      error: "Failed to fetch resources",
      details: error.message
    });
  }
}

/**
 * GET /api/resources/:requestId
 * Get resources for a specific request ID (for graph visualization)
 */
export async function getResourcesByRequest(req, res) {
  try {
    const { requestId } = req.params;

    // Query resources for this request
    const resources = await queryResourcesByRequestId(requestId);

    // Enrich with GitHub PR data
    const enrichedResources = await enrichResourcesWithPRs(resources);

    res.json({
      resources: enrichedResources,
      count: enrichedResources.length,
      requestId
    });
  } catch (error) {
    console.error(`Failed to fetch resources for request ${req.params.requestId}:`, error);
    res.status(500).json({
      error: "Failed to fetch resources",
      details: error.message
    });
  }
}
