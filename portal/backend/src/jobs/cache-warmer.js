#!/usr/bin/env node
/**
 * Cache Warmer Job
 * Pre-populates Redis cache with resource and cost data
 * Run via Kubernetes CronJob every hour
 */

import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { CostManagementClient } from "@azure/arm-costmanagement";
import { cache } from "../infrastructure/utils/Cache.js";

// Constants
const COST_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const RESOURCES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Subscription ID from environment
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

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

    // Fetch and cache resources
    const resources = await fetchResources(credential, SUBSCRIPTION_ID);
    const resourcesCacheKey = `resources:${SUBSCRIPTION_ID}`;
    await cache.set(resourcesCacheKey, resources, RESOURCES_CACHE_TTL);
    console.log(`[CacheWarmer] Cached ${resources.length} resources`);

    // Fetch and cache costs
    const costData = await fetchCosts(credential, SUBSCRIPTION_ID);
    const costCacheKey = `cost:subscription:${SUBSCRIPTION_ID}`;
    await cache.set(costCacheKey, costData, COST_CACHE_TTL);
    console.log(`[CacheWarmer] Cached cost data`);

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
