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
    resourceGroup = null,
    subscriptions = [], // Can be provided by frontend if needed
    skip = 0, // For pagination
    top = 1000 // Default limit
  } = options;

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
