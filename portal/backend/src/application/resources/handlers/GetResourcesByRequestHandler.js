/**
 * Handler for GetResourcesByRequestQuery
 * Retrieves resources for a specific request ID
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetResourcesByRequestHandler extends IRequestHandler {
  constructor(azureResourceService, resourceEnrichmentService) {
    super();
    this.azureResourceService = azureResourceService;
    this.resourceEnrichmentService = resourceEnrichmentService;
  }

  /**
   * Handle the GetResourcesByRequestQuery
   * @param {GetResourcesByRequestQuery} query
   * @returns {Promise<Result>} Resources for the request
   */
  async handle(query) {
    try {
      // Query resources for this request
      const resources = await this.azureResourceService.queryResourcesByRequestId(query.requestId);

      // Enrich with GitHub PR data (returns Resource entities)
      const enrichedResourceEntities = await this.resourceEnrichmentService.enrichResourcesWithPRs(resources);

      // Convert Resource entities to DTOs for API response
      const enrichedResources = enrichedResourceEntities.map(resource => resource.toDTO());

      return Result.success({
        resources: enrichedResources,
        count: enrichedResources.length,
        requestId: query.requestId
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
