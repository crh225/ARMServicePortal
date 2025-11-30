/**
 * Handler for GetFeatureFlagQuery
 * Retrieves a specific feature flag by key
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetFeatureFlagHandler extends IRequestHandler {
  constructor(featureFlagService) {
    super();
    this.featureFlagService = featureFlagService;
  }

  /**
   * Handle the GetFeatureFlagQuery
   * @param {GetFeatureFlagQuery} query
   * @returns {Promise<Result>} Result containing the feature flag or not found
   */
  async handle(query) {
    try {
      const flag = await this.featureFlagService.getFeatureFlag(query.featureKey);

      if (!flag) {
        return Result.notFound(`Feature flag '${query.featureKey}' not found`);
      }

      return Result.success(flag);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
