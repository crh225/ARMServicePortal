/**
 * Handler for GetResourceGroupsQuery
 * Retrieves resource groups filtered by environment
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetResourceGroupsHandler extends IRequestHandler {
  constructor(azureResourceService) {
    super();
    this.azureResourceService = azureResourceService;
  }

  /**
   * Handle the GetResourceGroupsQuery
   * @param {GetResourceGroupsQuery} query
   * @returns {Promise<Result>} Resource groups with metadata
   */
  async handle(query) {
    try {
      // Query resource groups from Azure Resource Graph
      const resourceGroups = await this.azureResourceService.queryResourceGroupsByEnvironment(query.environment);

      return Result.success({
        resourceGroups,
        count: resourceGroups.length,
        environment: query.environment || null
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
