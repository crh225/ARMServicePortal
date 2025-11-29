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
  /**
   * Extract PR numbers from resources
   */
  extractPRNumbers(resources) {
    const prNumbers = new Set();
    const moduleNames = new Set();

    resources.forEach(resource => {
      const requestId = resource.tags?.["armportal-request-id"];
      if (requestId) {
        const prNumber = parseInt(requestId, 10);
        if (!isNaN(prNumber)) {
          prNumbers.add(prNumber);
        } else {
          // Legacy: module name (for resources created before PR number tagging)
          moduleNames.add(requestId);
        }
      }
    });

    return {
      prNumbers: Array.from(prNumbers),
      moduleNames: Array.from(moduleNames)
    };
  }

  async enrichResourcesWithPRs(resources, includeCosts = false) {
    const { prNumbers, moduleNames } = this.extractPRNumbers(resources);

    // Fetch all PRs in parallel
    const prPromises = prNumbers.map(prNumber =>
      getGitHubRequestByNumber(prNumber)
        .then(pr => ({ prNumber, pr }))
        .catch(() => ({ prNumber, pr: null }))
    );

    const prResults = await Promise.all(prPromises);
    const prMap = new Map(prResults.map(({ prNumber, pr }) => [prNumber, pr]));

    // For legacy module names, look up the PR
    const moduleNameMap = new Map();
    const baseModuleNameMap = new Map();

    moduleNames.forEach(moduleName => {
      const baseModuleName = moduleName.includes('_')
        ? moduleName.split('_').slice(0, -1).join('_')
        : moduleName;

      if (!baseModuleNameMap.has(baseModuleName)) {
        baseModuleNameMap.set(baseModuleName, []);
      }
      baseModuleNameMap.get(baseModuleName).push(moduleName);
    });

    const uniqueBaseModulePromises = Array.from(baseModuleNameMap.keys()).map(async baseModuleName => {
      try {
        const pr = await findPRByModuleName(baseModuleName);
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

    // Enrich each resource
    return resources.map(resource => {
      const requestId = resource.tags?.["armportal-request-id"];
      const prNumber = requestId ? parseInt(requestId, 10) : null;

      let pr = null;
      if (prNumber && !isNaN(prNumber)) {
        pr = prMap.get(prNumber);
      } else if (requestId && moduleNameMap.has(requestId)) {
        pr = moduleNameMap.get(requestId);
      }

      let provisioningState = null;
      let health = null;

      const resourceType = (resource.type || "").toLowerCase();
      const isResourceGroup = resourceType === "microsoft.resources/resourcegroups";

      if (resourceType !== "microsoft.resources/subscriptions" && !isResourceGroup) {
        provisioningState = resource.properties?.provisioningState || null;
        health = provisioningState;
      }

      let cost = null;
      if (includeCosts) {
        if (isResourceGroup) {
          const rgKey = `${resource.subscriptionId}|${resource.name}`;
          cost = allRgTotals.get(rgKey);
          cost = cost !== undefined ? cost : 0;
        } else {
          const resourceCost = allCostsMap.get(resource.id.toLowerCase());
          cost = resourceCost !== undefined ? resourceCost : 0;
        }
      }

      const estimatedMonthlyCost = estimatedCostsMap.get(resource.id);

      // Create Resource entity with business logic
      return new Resource({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        location: resource.location,
        resourceGroup: resource.resourceGroup,
        subscriptionId: resource.subscriptionId,
        tags: resource.tags || {},
        properties: resource.properties || {},
        provisioningState,
        health,
        cost,
        estimatedMonthlyCost,
        prNumber,
        pr
      });
    });
  }
}
