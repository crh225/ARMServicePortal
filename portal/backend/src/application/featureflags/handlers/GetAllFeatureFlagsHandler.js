/**
 * Handler for GetAllFeatureFlagsQuery
 * Retrieves all feature flags from Azure App Configuration
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetAllFeatureFlagsHandler extends IRequestHandler {
  constructor(featureFlagService) {
    super();
    this.featureFlagService = featureFlagService;
  }

  /**
   * Handle the GetAllFeatureFlagsQuery
   * @param {GetAllFeatureFlagsQuery} query
   * @returns {Promise<Result>} Result containing all feature flags
   */
  async handle(query) {
    try {
      const flags = await this.featureFlagService.getAllFeatureFlags();
      return Result.success(flags);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
