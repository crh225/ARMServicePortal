/**
 * Handler for GetResourcesQuery
 * Retrieves and enriches ARM Portal resources
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetResourcesHandler extends IRequestHandler {
  constructor(azureResourceService, resourceEnrichmentService) {
    super();
    this.azureResourceService = azureResourceService;
    this.resourceEnrichmentService = resourceEnrichmentService;
  }

  /**
   * Handle the GetResourcesQuery
   * @param {GetResourcesQuery} query
   * @returns {Promise<Result>} Resources with metadata
   */
  async handle(query) {
    try {
      const options = {};
      if (query.environment) options.environment = query.environment;
      if (query.blueprintId) options.blueprintId = query.blueprintId;
      if (query.resourceGroup) options.resourceGroup = query.resourceGroup;
      if (query.subscriptions) {
        options.subscriptions = query.subscriptions.split(",").map(s => s.trim());
      }

      const shouldIncludeCosts = query.includeCosts === 'true';

      if (query.skip) {
        const skipNum = parseInt(query.skip, 10);
        if (!isNaN(skipNum) && skipNum >= 0) {
          options.skip = skipNum;
        }
      }

      if (query.top) {
        const topNum = parseInt(query.top, 10);
        if (!isNaN(topNum) && topNum > 0 && topNum <= 1000) {
          options.top = topNum;
        }
      }

      // Query Azure Resource Graph
      const resources = await this.azureResourceService.queryArmPortalResources(options);

      // Enrich with GitHub PR data and optionally costs (returns Resource entities)
      const enrichedResourceEntities = await this.resourceEnrichmentService.enrichResourcesWithPRs(
        resources,
        shouldIncludeCosts
      );

      // Convert Resource entities to DTOs for API response
      const enrichedResources = enrichedResourceEntities.map(resource => resource.toDTO());

      return Result.success({
        resources: enrichedResources,
        count: enrichedResources.length,
        skip: options.skip || 0,
        top: options.top || 1000
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
