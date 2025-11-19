/**
 * Resources Controller
 * Handles Azure Resource Graph queries and resource enrichment
 */

import { queryArmPortalResources, queryResourcesByRequestId } from "../services/azureResourceGraph.js";
import { getGitHubRequestByNumber } from "../services/github/pullRequests.js";

/**
 * Extract PR numbers from resources
 */
function extractPRNumbers(resources) {
  const prNumbers = new Set();

  resources.forEach(resource => {
    const requestId = resource.tags?.["armportal-request-id"];
    if (requestId) {
      const prNumber = parseInt(requestId, 10);
      if (!isNaN(prNumber)) {
        prNumbers.add(prNumber);
      }
    }
  });

  return Array.from(prNumbers);
}

/**
 * Enrich resources with GitHub PR data
 */
async function enrichResourcesWithPRs(resources) {
  const prNumbers = extractPRNumbers(resources);

  // Fetch all PRs in parallel
  const prPromises = prNumbers.map(prNumber =>
    getGitHubRequestByNumber(prNumber)
      .then(pr => ({ prNumber, pr }))
      .catch(() => ({ prNumber, pr: null }))
  );

  const prResults = await Promise.all(prPromises);
  const prMap = new Map(prResults.map(({ prNumber, pr }) => [prNumber, pr]));

  // Enrich each resource
  return resources.map(resource => {
    const requestId = resource.tags?.["armportal-request-id"];
    const prNumber = requestId ? parseInt(requestId, 10) : null;
    const pr = prNumber && !isNaN(prNumber) ? prMap.get(prNumber) : null;

    // Extract health/provisioning state from properties
    const provisioningState = resource.properties?.provisioningState || null;
    const health = provisioningState ? provisioningState : null;

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
      top
    } = req.query;

    const options = {};
    if (environment) options.environment = environment;
    if (blueprintId) options.blueprintId = blueprintId;
    if (resourceGroup) options.resourceGroup = resourceGroup;
    if (subscriptions) {
      // Parse subscriptions if provided as comma-separated string
      options.subscriptions = subscriptions.split(",").map(s => s.trim());
    }

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

    // Enrich with GitHub PR data
    const enrichedResources = await enrichResourcesWithPRs(resources);

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
