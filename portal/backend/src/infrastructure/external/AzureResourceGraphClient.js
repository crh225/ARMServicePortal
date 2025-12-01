/**
 * Azure Resource Graph Service
 * Uses the Container App's SystemAssigned Managed Identity to query Azure resources
 */

import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { cache } from "../utils/Cache.js";

// Initialize with managed identity (works in Container Apps)
const credential = new DefaultAzureCredential();
const client = new ResourceGraphClient(credential);

// Cache keys and TTL
const RESOURCE_GROUPS_CACHE_KEY = "resourceGroups:all";
const RESOURCE_GROUPS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const RESOURCES_CACHE_KEY = "resources:all";
const RESOURCES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for resource list

/**
 * Query Azure Resource Graph for ARM Portal resources
 * @param {object} options - Query options
 * @returns {Promise<Array>} Array of resources
 */
export async function queryArmPortalResources(options = {}) {
  const {
    environment = null,
    blueprintId = null,
    requestId = null,
    resourceGroup = null,
    subscriptions = [], // Can be provided by frontend if needed
    skip = 0, // For pagination
    top = 1000 // Default limit
  } = options;

  // Check Redis cache for unfiltered queries (used by home stats)
  const isUnfilteredQuery = !environment && !blueprintId && !requestId && !resourceGroup && skip === 0;
  if (isUnfilteredQuery) {
    const cached = await cache.get(RESOURCES_CACHE_KEY);
    if (cached && cached.timestamp && (Date.now() - cached.timestamp) < RESOURCES_CACHE_TTL) {
      console.log(`[Resources] Cache HIT (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s, count: ${cached.data.length})`);
      return cached.data;
    }
  }

  // Build KQL query - get ALL resources and resource groups
  let query = "ResourceContainers | union Resources";

  // Apply filters if provided
  if (environment) {
    query += ` | where tags['armportal-environment'] =~ '${environment}'`;
  }

  if (blueprintId) {
    query += ` | where tags['armportal-blueprint'] =~ '${blueprintId}'`;
  }

  if (requestId) {
    query += ` | where tags['armportal-request-id'] =~ '${requestId}'`;
  }

  if (resourceGroup) {
    query += ` | where resourceGroup =~ '${resourceGroup}'`;
  }

  // Project relevant fields
  query += ` | project id, name, type, location, resourceGroup, subscriptionId, tags, properties`;

  // Add sorting and pagination
  query += ` | order by name asc`;

  if (skip > 0) {
    query += ` | skip ${skip}`;
  }

  if (top > 0 && top <= 1000) {
    query += ` | limit ${top}`;
  }

  try {
    const queryRequest = {
      query,
      options: {
        resultFormat: "objectArray"
      }
    };

    // Add subscriptions if provided, otherwise query ALL accessible subscriptions
    if (subscriptions && subscriptions.length > 0) {
      queryRequest.subscriptions = subscriptions;
    }
    // Note: If subscriptions array is not provided, Azure Resource Graph will automatically
    // query ALL subscriptions accessible by the managed identity

    console.log("Executing Azure Resource Graph query:", query);
    console.log("Subscriptions:", queryRequest.subscriptions || "ALL accessible subscriptions");

    const result = await client.resources(queryRequest);
    const resources = result.data || [];

    // Cache unfiltered query results to Redis
    if (isUnfilteredQuery) {
      await cache.set(RESOURCES_CACHE_KEY, {
        data: resources,
        timestamp: Date.now()
      }, RESOURCES_CACHE_TTL);
      console.log(`[Resources] Cache MISS - Cached ${resources.length} resources`);
    }

    return resources;
  } catch (error) {
    console.error("Azure Resource Graph query failed:", error);
    throw new Error(`Failed to query Azure resources: ${error.message}`);
  }
}

/**
 * Query resources by specific request ID (PR number)
 * @param {string} requestId - ARM Portal request ID
 * @returns {Promise<Array>} Array of resources
 */
export async function queryResourcesByRequestId(requestId) {
  return await queryArmPortalResources({ requestId });
}

/**
 * Query resource groups, optionally filtered by environment tag or name pattern
 * @param {string} environment - Environment to filter by (e.g., "dev", "qa", "prod")
 * @param {Array<string>} subscriptions - Optional list of subscription IDs
 * @returns {Promise<Array>} Array of resource group names
 */
export async function queryResourceGroupsByEnvironment(environment = null, subscriptions = []) {
  // Check Redis cache first
  const cached = await cache.get(RESOURCE_GROUPS_CACHE_KEY);
  let allResourceGroups;

  if (cached && cached.timestamp && (Date.now() - cached.timestamp) < RESOURCE_GROUPS_CACHE_TTL) {
    // Use cached data
    allResourceGroups = cached.data;
    console.log(`[ResourceGroups] Cache HIT (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
  } else {
    // Query Azure Resource Graph
    const query = "ResourceContainers | union Resources | where type =~ 'microsoft.resources/subscriptions/resourcegroups' | project name | order by name asc";

    try {
      const queryRequest = {
        query,
        options: {
          resultFormat: "objectArray"
        }
      };

      // Add subscriptions if provided, otherwise query ALL accessible subscriptions
      if (subscriptions && subscriptions.length > 0) {
        queryRequest.subscriptions = subscriptions;
      }
      // Note: If subscriptions array is not provided, Azure Resource Graph will automatically
      // query ALL subscriptions accessible by the managed identity

      const result = await client.resources(queryRequest);
      allResourceGroups = (result.data || []).map(rg => rg.name);

      // Cache to Redis
      await cache.set(RESOURCE_GROUPS_CACHE_KEY, {
        data: allResourceGroups,
        timestamp: Date.now()
      }, RESOURCE_GROUPS_CACHE_TTL);
      console.log(`[ResourceGroups] Cache MISS - Cached ${allResourceGroups.length} resource groups`);
    } catch (error) {
      console.error("Resource Groups query failed:", error);
      throw new Error(`Failed to query resource groups: ${error.message}`);
    }
  }

  // Filter by environment on the backend if provided
  if (environment) {
    return allResourceGroups.filter(name => {
      const lowerName = name.toLowerCase();
      const lowerEnv = environment.toLowerCase();
      // Match if name contains -env- or ends with -env
      return lowerName.includes(`-${lowerEnv}-`) || lowerName.endsWith(`-${lowerEnv}`);
    });
  }

  return allResourceGroups;
}

/**
 * Get all ARM Portal managed resources
 * @returns {Promise<Array>} Array of all ARM Portal resources
 */
export async function getAllArmPortalResources() {
  return await queryArmPortalResources();
}

/**
 * Query a specific resource by its Azure resource ID
 * @param {string} resourceId - Azure resource ID
 * @returns {Promise<object|null>} Resource object or null if not found
 */
export async function queryResourceById(resourceId) {
  // Escape single quotes in the resource ID for KQL
  const escapedId = resourceId.replace(/'/g, "\\'");

  const query = `ResourceContainers | union Resources | where id =~ '${escapedId}' | project id, name, type, location, resourceGroup, subscriptionId, tags, properties`;

  try {
    const queryRequest = {
      query,
      options: {
        resultFormat: "objectArray"
      }
    };

    console.log("Executing Azure Resource Graph query for resource ID:", resourceId);

    const result = await client.resources(queryRequest);
    const resources = result.data || [];

    if (resources.length === 0) {
      return null;
    }

    return resources[0];
  } catch (error) {
    console.error("Azure Resource Graph query by ID failed:", error);
    throw new Error(`Failed to query Azure resource by ID: ${error.message}`);
  }
}
