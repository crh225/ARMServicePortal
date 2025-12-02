#!/usr/bin/env node
/**
 * Cache Warmer Job
 * Pre-populates Redis cache with resource and cost data
 * Run via Kubernetes CronJob every 5 minutes for home stats, hourly for costs
 */

import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { CostManagementClient } from "@azure/arm-costmanagement";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { cache } from "../infrastructure/utils/Cache.js";
import { getLatestBlueprints } from "../config/blueprints.js";

// Constants
const COST_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const RESOURCES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const HOME_STATS_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const JOB_COUNT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Environment variables
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const GH_APP_ID = process.env.GH_APP_ID;
const GH_INSTALLATION_ID = process.env.GH_INSTALLATION_ID;
const GH_APP_PRIVATE_KEY_BASE64 = process.env.GH_APP_PRIVATE_KEY_BASE64;
const GH_INFRA_OWNER = process.env.GH_INFRA_OWNER;
const GH_INFRA_REPO = process.env.GH_INFRA_REPO;

async function fetchResources(credential, subscriptionId) {
  console.log("[CacheWarmer] Fetching resources from Azure Resource Graph...");

  const client = new ResourceGraphClient(credential);

  const query = `
    Resources
    | where subscriptionId == "${subscriptionId}"
    | project id, name, type, location, resourceGroup, subscriptionId, tags, sku, kind, properties
    | order by type asc, name asc
  `;

  const result = await client.resources(
    { query, subscriptions: [subscriptionId] },
    { resultFormat: "objectArray" }
  );

  console.log(`[CacheWarmer] Found ${result.data?.length || 0} resources`);
  return result.data || [];
}

async function fetchCosts(credential, subscriptionId) {
  console.log("[CacheWarmer] Fetching costs from Azure Cost Management...");

  const client = new CostManagementClient(credential);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const scope = `/subscriptions/${subscriptionId}`;

  const queryDefinition = {
    type: "ActualCost",
    timeframe: "Custom",
    timePeriod: {
      from: startDate.toISOString().split("T")[0],
      to: endDate.toISOString().split("T")[0],
    },
    dataset: {
      granularity: "None",
      aggregation: {
        totalCost: {
          name: "Cost",
          function: "Sum",
        },
      },
      grouping: [
        { type: "Dimension", name: "ResourceId" },
        { type: "Dimension", name: "ResourceGroupName" },
      ],
    },
  };

  const result = await client.query.usage(scope, queryDefinition);

  const costMap = {};
  const rgTotals = {};

  if (result.rows && result.rows.length > 0) {
    for (const row of result.rows) {
      const cost = parseFloat(row[0]) || 0;
      const resourceId = row[1];
      const resourceGroupName = row[2];

      if (resourceId) {
        costMap[resourceId.toLowerCase()] = cost;
      }

      if (resourceGroupName) {
        rgTotals[resourceGroupName] = (rgTotals[resourceGroupName] || 0) + cost;
      }
    }
  }

  console.log(`[CacheWarmer] Found costs for ${Object.keys(costMap).length} resources, ${Object.keys(rgTotals).length} RGs`);
  return { costMap, rgTotals };
}

/**
 * Get GitHub installation client for API calls
 */
async function getGitHubClient() {
  if (!GH_APP_ID || !GH_INSTALLATION_ID || !GH_APP_PRIVATE_KEY_BASE64) {
    console.log("[CacheWarmer] GitHub App not configured, skipping job count");
    return null;
  }

  const privateKey = Buffer.from(GH_APP_PRIVATE_KEY_BASE64, "base64").toString("utf8");

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: GH_APP_ID,
      privateKey,
      installationId: GH_INSTALLATION_ID,
    },
  });

  return octokit;
}

/**
 * Fetch job count using GitHub Search API (fast - single call)
 */
async function fetchJobCount(octokit) {
  if (!octokit || !GH_INFRA_OWNER || !GH_INFRA_REPO) {
    return 0;
  }

  console.log("[CacheWarmer] Fetching job count from GitHub...");

  try {
    const { data } = await octokit.search.issuesAndPullRequests({
      q: `repo:${GH_INFRA_OWNER}/${GH_INFRA_REPO} is:pr head:requests/`,
      per_page: 1,
    });

    console.log(`[CacheWarmer] Found ${data.total_count} jobs`);
    return data.total_count;
  } catch (error) {
    console.error("[CacheWarmer] Failed to fetch job count:", error.message);
    return 0;
  }
}

/**
 * Fetch blueprint count from config
 */
function fetchBlueprintCount() {
  console.log("[CacheWarmer] Counting blueprints...");

  try {
    const blueprints = getLatestBlueprints();
    console.log(`[CacheWarmer] Found ${blueprints.length} blueprints`);
    return blueprints.length;
  } catch (error) {
    console.error("[CacheWarmer] Failed to count blueprints:", error.message);
    return 0;
  }
}

/**
 * Fetch ARM Portal resources count (tagged resources only)
 */
async function fetchArmPortalResourceCount(credential) {
  console.log("[CacheWarmer] Fetching ARM Portal resource count...");

  const client = new ResourceGraphClient(credential);

  // Query for ARM Portal tagged resources (same as the service uses)
  const query = `
    ResourceContainers | union Resources
    | project id, name, type, location, resourceGroup, subscriptionId, tags, properties
    | order by name asc
  `;

  try {
    const result = await client.resources({
      query,
      options: { resultFormat: "objectArray" }
    });

    const resources = result.data || [];
    console.log(`[CacheWarmer] Found ${resources.length} ARM Portal resources`);

    // Cache the full resource list too
    await cache.set("resources:all", {
      data: resources,
      timestamp: Date.now()
    }, RESOURCES_CACHE_TTL);

    return resources.length;
  } catch (error) {
    console.error("[CacheWarmer] Failed to fetch ARM Portal resources:", error.message);
    return 0;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("[CacheWarmer] Starting cache warmup job...");
  console.log(`[CacheWarmer] Time: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  if (!SUBSCRIPTION_ID) {
    console.error("[CacheWarmer] ERROR: AZURE_SUBSCRIPTION_ID is not set");
    process.exit(1);
  }

  try {
    // Initialize cache (connects to Redis)
    await cache.init();
    console.log(`[CacheWarmer] Cache initialized, using Redis: ${cache.isUsingRedis()}`);

    const credential = new DefaultAzureCredential();
    const octokit = await getGitHubClient();

    // Fetch all data in parallel for speed
    const [resources, costData, jobCount, blueprintCount, armPortalResourceCount] = await Promise.all([
      fetchResources(credential, SUBSCRIPTION_ID),
      fetchCosts(credential, SUBSCRIPTION_ID),
      fetchJobCount(octokit),
      fetchBlueprintCount(),
      fetchArmPortalResourceCount(credential),
    ]);

    // Cache resources
    const resourcesCacheKey = `resources:${SUBSCRIPTION_ID}`;
    await cache.set(resourcesCacheKey, resources, RESOURCES_CACHE_TTL);
    console.log(`[CacheWarmer] Cached ${resources.length} subscription resources`);

    // Cache costs
    const costCacheKey = `cost:subscription:${SUBSCRIPTION_ID}`;
    await cache.set(costCacheKey, costData, COST_CACHE_TTL);
    console.log(`[CacheWarmer] Cached cost data`);

    // Cache job count
    await cache.set("jobs:count:all", jobCount, JOB_COUNT_CACHE_TTL);
    console.log(`[CacheWarmer] Cached job count: ${jobCount}`);

    // Cache home stats (the aggregate that the frontend fetches)
    const homeStats = {
      stats: {
        blueprints: blueprintCount,
        resources: armPortalResourceCount,
        jobs: jobCount,
      },
      timestamp: Date.now(),
    };
    await cache.set("stats:home", homeStats, HOME_STATS_CACHE_TTL);
    console.log(`[CacheWarmer] Cached home stats: ${JSON.stringify(homeStats.stats)}`);

    // Log final stats
    const stats = await cache.stats();
    console.log("[CacheWarmer] Final cache stats:", stats);

    console.log("=".repeat(60));
    console.log("[CacheWarmer] Cache warmup completed successfully!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("[CacheWarmer] ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
