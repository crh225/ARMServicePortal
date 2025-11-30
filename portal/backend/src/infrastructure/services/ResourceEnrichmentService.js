/**
 * Resource Enrichment Service Implementation
 * Encapsulates the logic for enriching resources with PR and cost data
 */
import { IResourceEnrichmentService } from "../../domain/services/IResourceEnrichmentService.js";
import { Resource } from "../../domain/entities/Resource.js";
import { getGitHubRequestByNumber, findPRByModuleName } from "../external/github/pullRequests.js";
import { getSubscriptionCosts } from "../external/AzureCostManagementClient.js";
import { estimateResourceCost } from "../external/ResourceCostEstimator.js";

export class ResourceEnrichmentService extends IResourceEnrichmentService {
  async enrichResourcesWithPRs(resources, includeCosts = false) {
    // Convert raw resources to Resource entities for domain logic access
    const resourceEntities = resources.map(r =>
      r instanceof Resource ? r : new Resource(r)
    );

    // Use domain entity's static method for extracting request IDs
    const { prNumbers, moduleNames } = Resource.extractRequestIds(resourceEntities);

    // Fetch all PRs in parallel (handle Result pattern)
    const prPromises = prNumbers.map(async prNumber => {
      try {
        const result = await getGitHubRequestByNumber(prNumber);
        // Handle Result pattern - extract value if successful
        const pr = result.isSuccess ? result.value : null;
        return { prNumber, pr };
      } catch {
        return { prNumber, pr: null };
      }
    });

    const prResults = await Promise.all(prPromises);
    const prMap = new Map(prResults.map(({ prNumber, pr }) => [prNumber, pr]));

    // For legacy module names, look up the PR using domain method
    const moduleNameMap = new Map();
    const baseModuleNameMap = new Map();

    moduleNames.forEach(moduleName => {
      // Use domain entity's static method for base module name extraction
      const baseModuleName = Resource.getBaseModuleName(moduleName);

      if (!baseModuleNameMap.has(baseModuleName)) {
        baseModuleNameMap.set(baseModuleName, []);
      }
      baseModuleNameMap.get(baseModuleName).push(moduleName);
    });

    const uniqueBaseModulePromises = Array.from(baseModuleNameMap.keys()).map(async baseModuleName => {
      try {
        const result = await findPRByModuleName(baseModuleName);
        // Handle Result pattern - extract value if successful
        const pr = result.isSuccess ? result.value : null;
        return { baseModuleName, pr };
      } catch (error) {
        console.error(`Failed to find PR for module ${baseModuleName}:`, error);
        return { baseModuleName, pr: null };
      }
    });

    const basePrResults = await Promise.all(uniqueBaseModulePromises);

    basePrResults.forEach(({ baseModuleName, pr }) => {
      const moduleNamesForBase = baseModuleNameMap.get(baseModuleName);
      moduleNamesForBase.forEach(moduleName => {
        moduleNameMap.set(moduleName, pr);
      });
    });

    // Optionally fetch costs
    let allCostsMap = new Map();
    let allRgTotals = new Map();

    if (includeCosts) {
      const subscriptions = new Set();
      resources.forEach(resource => {
        if (resource.subscriptionId) {
          subscriptions.add(resource.subscriptionId);
        }
      });

      const costPromises = Array.from(subscriptions).map(async subscriptionId => {
        const result = await getSubscriptionCosts(subscriptionId);
        // costMap and rgTotals are now plain objects (for Redis serialization)
        const costMapKeys = Object.keys(result.costMap || {});
        const rgTotalsKeys = Object.keys(result.rgTotals || {});
        console.log(`Cost query for subscription ${subscriptionId}: ${costMapKeys.length} resources, ${rgTotalsKeys.length} RGs`);
        return { subscriptionId, costMap: result.costMap || {}, rgTotals: result.rgTotals || {} };
      });

      const costResults = await Promise.all(costPromises);

      costResults.forEach(({ subscriptionId, costMap, rgTotals }) => {
        // Iterate over plain objects instead of Maps
        Object.entries(costMap).forEach(([resourceId, cost]) => {
          allCostsMap.set(resourceId, cost);
        });
        Object.entries(rgTotals).forEach(([rgName, cost]) => {
          const key = `${subscriptionId}|${rgName}`;
          console.log(`Storing RG cost for key "${key}": $${cost}`);
          allRgTotals.set(key, cost);
        });
      });
    }

    // Estimate costs for all resources
    const estimatedCostsPromises = resources.map(async resource => {
      try {
        const estimate = await estimateResourceCost(resource);
        return { id: resource.id, estimatedCost: estimate };
      } catch (error) {
        console.error(`Failed to estimate cost for ${resource.id}:`, error);
        return { id: resource.id, estimatedCost: null };
      }
    });

    const estimatedCostsResults = await Promise.all(estimatedCostsPromises);
    const estimatedCostsMap = new Map(
      estimatedCostsResults.map(({ id, estimatedCost }) => [id, estimatedCost])
    );

    // Enrich each resource using domain entity methods
    return resourceEntities.map((resourceEntity, index) => {
      const resource = resources[index]; // Keep reference to original raw resource

      // Use domain entity's method for parsing request ID
      const { prNumber, moduleName } = resourceEntity.parseRequestId();

      // Look up PR from maps
      let pr = null;
      if (prNumber) {
        pr = prMap.get(prNumber);
      } else if (moduleName && moduleNameMap.has(moduleName)) {
        pr = moduleNameMap.get(moduleName);
      }

      // Use domain entity's method for deriving health state
      const { provisioningState, health } = resourceEntity.deriveHealthState();

      // Determine cost based on resource type (uses domain entity methods)
      let cost = null;
      if (includeCosts) {
        if (resourceEntity.isResourceGroup()) {
          const rgKey = `${resourceEntity.subscriptionId}|${resourceEntity.name}`;
          cost = allRgTotals.get(rgKey);
          cost = cost !== undefined ? cost : 0;
        } else {
          const resourceCost = allCostsMap.get(resourceEntity.id.toLowerCase());
          cost = resourceCost !== undefined ? resourceCost : 0;
        }
      }

      const estimatedMonthlyCost = estimatedCostsMap.get(resourceEntity.id);

      // Enrich the entity using domain methods
      resourceEntity.enrichWithPR(pr);
      resourceEntity.enrichWithCost(cost);
      resourceEntity.enrichWithEstimatedCost(estimatedMonthlyCost);

      // Update provisioning state and health
      resourceEntity.provisioningState = provisioningState;
      resourceEntity.health = health;
      resourceEntity.prNumber = prNumber;

      return resourceEntity;
    });
  }
}
