/**
 * Handler for GetCostEstimateQuery
 * Retrieves cost estimate for blueprint with variables
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { BlueprintId } from "../../../domain/value-objects/BlueprintId.js";
import { Result } from "../../../domain/common/Result.js";

export class GetCostEstimateHandler extends IRequestHandler {
  constructor(blueprintRepository, pricingRepository) {
    super();
    this.blueprintRepository = blueprintRepository;
    this.pricingRepository = pricingRepository;
  }

  /**
   * Handle the GetCostEstimateQuery
   * @param {GetCostEstimateQuery} query
   * @returns {Promise<Result>} Cost estimate
   */
  async handle(query) {
    try {
      // Validate inputs
      if (!query.blueprintIdString || !query.variables) {
        return Result.validationFailure([{
          field: 'blueprintId',
          message: 'blueprintId and variables are required'
        }]);
      }

      // Validate blueprint ID
      const blueprintId = new BlueprintId(query.blueprintIdString);

      // Get blueprint
      const blueprint = await this.blueprintRepository.getById(blueprintId);
      if (!blueprint) {
        return Result.notFound('Unknown blueprintId');
      }

      // Get cost estimate
      const estimate = await this.pricingRepository.estimateCost(
        query.blueprintIdString,
        query.variables,
        blueprint
      );

      return Result.success(estimate);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
