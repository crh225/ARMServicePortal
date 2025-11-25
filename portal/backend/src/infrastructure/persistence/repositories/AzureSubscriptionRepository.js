/**
 * Azure Subscription Repository
 * Implements ISubscriptionRepository using Azure Resource Graph
 */
import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { ISubscriptionRepository } from "../../../domain/repositories/ISubscriptionRepository.js";
import { Subscription } from "../../../domain/entities/Subscription.js";

export class AzureSubscriptionRepository extends ISubscriptionRepository {
  constructor() {
    super();
    this.client = null;
  }

  /**
   * Get or create client lazily
   */
  getClient() {
    if (!this.client) {
      const credential = new DefaultAzureCredential();
      this.client = new ResourceGraphClient(credential);
    }
    return this.client;
  }

  /**
   * Get all accessible Azure subscriptions using Resource Graph
   */
  async getAll() {
    const client = this.getClient();

    // Query Resource Graph for all subscriptions
    const query = "resourcecontainers | where type == 'microsoft.resources/subscriptions' | project subscriptionId, name, tenantId";

    const response = await client.resources({
      query,
      subscriptions: []  // Empty array queries all accessible subscriptions
    });

    const subscriptions = (response.data || []).map(sub => new Subscription({
      id: sub.subscriptionId,
      name: sub.name,
      state: 'Enabled',  // Resource Graph only returns enabled subscriptions
      tenantId: sub.tenantId
    }));

    console.log(`Found ${subscriptions.length} accessible subscriptions`);
    return subscriptions;
  }
}
