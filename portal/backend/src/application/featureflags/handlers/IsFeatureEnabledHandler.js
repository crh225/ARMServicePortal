/**
 * Handler for IsFeatureEnabledQuery
 * Checks if a feature is enabled with optional targeting context
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class IsFeatureEnabledHandler extends IRequestHandler {
  constructor(featureFlagService) {
    super();
    this.featureFlagService = featureFlagService;
  }

  /**
   * Handle the IsFeatureEnabledQuery
   * @param {IsFeatureEnabledQuery} query
   * @returns {Promise<Result>} Result containing boolean enabled status
   */
  async handle(query) {
    try {
      const isEnabled = await this.featureFlagService.isFeatureEnabled(
        query.featureKey,
        query.context
      );

      return Result.success({
        featureKey: query.featureKey,
        enabled: isEnabled
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
