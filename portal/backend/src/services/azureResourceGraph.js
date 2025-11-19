/**
 * Azure Resource Graph Service
 * Uses the Container App's SystemAssigned Managed Identity to query Azure resources
 */

import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";

// Initialize with managed identity (works in Container Apps)
const credential = new DefaultAzureCredential();
const client = new ResourceGraphClient(credential);

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
    subscriptions = [] // Can be provided by frontend if needed
  } = options;

  // Build KQL query
  // Start with ResourceContainers (includes resource groups) and Resources
  let query = "ResourceContainers | union Resources | where isnotempty(tags) and (isnotnull(tags['armportal-environment']) or isnotnull(tags['armportal-blueprint']) or isnotnull(tags['armportal-request-id']))";

  if (environment) {
    query += ` | where tags['armportal-environment'] =~ '${environment}'`;
  }

  if (blueprintId) {
    query += ` | where tags['armportal-blueprint'] =~ '${blueprintId}'`;
  }

  if (requestId) {
    query += ` | where tags['armportal-request-id'] =~ '${requestId}'`;
  }

  // Project relevant fields
  query += ` | project id, name, type, location, resourceGroup, subscriptionId, tags, properties`;

  try {
    const queryRequest = {
      query,
      options: {
        resultFormat: "objectArray"
      }
    };

    // Add subscriptions if provided, otherwise use default subscription
    if (subscriptions && subscriptions.length > 0) {
      queryRequest.subscriptions = subscriptions;
    } else {
      // When running locally, we need to specify the subscription explicitly
      // Get from environment variable or use the known subscription ID
      const defaultSubscription = process.env.AZURE_SUBSCRIPTION_ID || "f989de0f-8697-4a05-8c34-b82c941767c0";
      queryRequest.subscriptions = [defaultSubscription];
    }

    console.log("Executing Azure Resource Graph query:", query);
    console.log("Subscriptions:", queryRequest.subscriptions);

    const result = await client.resources(queryRequest);
    console.log("Query result:", result);
    return result.data || [];
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
 * Get all ARM Portal managed resources
 * @returns {Promise<Array>} Array of all ARM Portal resources
 */
export async function getAllArmPortalResources() {
  return await queryArmPortalResources();
}
