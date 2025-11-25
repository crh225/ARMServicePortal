/**
 * Pricing Controller
 * Handles HTTP requests for cost estimation
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetCostEstimateQuery } from "../application/blueprints/queries/GetCostEstimateQuery.js";

/**
 * POST /api/pricing/estimate
 * Get cost estimate for a blueprint configuration
 */
export function createGetCostEstimateHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { blueprintId, variables } = req.body || {};
    const query = new GetCostEstimateQuery(blueprintId, variables);
    const result = await mediator.send(query);
    return res.json(result);
  });
}
