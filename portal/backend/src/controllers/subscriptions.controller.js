/**
 * Subscriptions Controller
 * Handles Azure subscription listing
 */

import { DefaultAzureCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";

/**
 * GET /api/subscriptions
 * List all accessible Azure subscriptions
 */
export async function getSubscriptions(req, res) {
  try {
    const credential = new DefaultAzureCredential();
    const client = new SubscriptionClient(credential);

    const subscriptions = [];

    // List all subscriptions accessible by the managed identity
    for await (const subscription of client.subscriptions.list()) {
      subscriptions.push({
        id: subscription.subscriptionId,
        name: subscription.displayName,
        state: subscription.state,
        tenantId: subscription.tenantId
      });
    }

    console.log(`Found ${subscriptions.length} accessible subscriptions`);

    res.json({
      subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    res.status(500).json({
      error: "Failed to fetch subscriptions",
      details: error.message
    });
  }
}
