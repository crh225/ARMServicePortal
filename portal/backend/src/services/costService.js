/**
 * Azure Cost Management Service
 * Fetches cost data for resources using Azure Cost Management API
 */

import { CostManagementClient } from "@azure/arm-costmanagement";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Get cost for a specific resource over the last 30 days
 * @param {string} resourceId - Full Azure resource ID
 * @returns {Promise<number|null>} Total cost in USD, or null if unavailable
 */
export async function getResourceCost(resourceId) {
  try {
    const credential = new DefaultAzureCredential();
    const subscriptionMatch = resourceId.match(/\/subscriptions\/([^\/]+)\//);

    if (!subscriptionMatch) {
      console.warn(`Could not extract subscription from resource ID: ${resourceId}`);
      return null;
    }

    const subscriptionId = subscriptionMatch[1];
    const client = new CostManagementClient(credential);

    // Query for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const scope = resourceId;

    const queryDefinition = {
      type: "ActualCost",
      timeframe: "Custom",
      timePeriod: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      },
      dataset: {
        granularity: "None",
        aggregation: {
          totalCost: {
            name: "Cost",
            function: "Sum"
          }
        },
        grouping: []
      }
    };

    const result = await client.query.usage(scope, queryDefinition);

    if (result.rows && result.rows.length > 0) {
      // Cost is typically in the first column
      const cost = result.rows[0][0];
      return parseFloat(cost) || 0;
    }

    return 0;
  } catch (error) {
    console.error(`Failed to fetch cost for resource ${resourceId}:`, error.message);
    return null;
  }
}

/**
 * Get costs for all resources in a subscription
 * More efficient than querying per-resource-group (avoids rate limiting)
 * @param {string} subscriptionId - Azure subscription ID
 * @returns {Promise<Object>} Object with costMap (resource ID to cost) and rgTotals (RG name to total cost)
 */
export async function getSubscriptionCosts(subscriptionId) {
  try {
    const credential = new DefaultAzureCredential();
    const client = new CostManagementClient(credential);

    // Query for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const scope = `/subscriptions/${subscriptionId}`;

    const queryDefinition = {
      type: "ActualCost",
      timeframe: "Custom",
      timePeriod: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      },
      dataset: {
        granularity: "None",
        aggregation: {
          totalCost: {
            name: "Cost",
            function: "Sum"
          }
        },
        grouping: [
          {
            type: "Dimension",
            name: "ResourceId"
          },
          {
            type: "Dimension",
            name: "ResourceGroupName"
          }
        ]
      }
    };

    const result = await client.query.usage(scope, queryDefinition);

    // Build maps for both individual resources and RG totals
    const costMap = new Map(); // resource ID -> cost
    const rgTotals = new Map(); // resource group name -> total cost

    if (result.rows && result.rows.length > 0) {
      for (const row of result.rows) {
        const cost = parseFloat(row[0]) || 0;
        const resourceId = row[1]; // ResourceId
        const resourceGroupName = row[2]; // ResourceGroupName

        // Store individual resource cost
        if (resourceId) {
          costMap.set(resourceId.toLowerCase(), cost);
        }

        // Accumulate RG totals
        if (resourceGroupName) {
          const currentTotal = rgTotals.get(resourceGroupName) || 0;
          rgTotals.set(resourceGroupName, currentTotal + cost);
        }
      }
    }

    return { costMap, rgTotals };
  } catch (error) {
    console.error(`Failed to fetch costs for subscription ${subscriptionId}:`, error.message);
    return { costMap: new Map(), rgTotals: new Map() };
  }
}
