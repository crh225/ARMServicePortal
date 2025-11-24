/**
 * Subscriptions Controller
 * Handles HTTP requests for Azure subscriptions
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetAllSubscriptionsQuery } from "../application/subscriptions/queries/GetAllSubscriptionsQuery.js";

/**
 * GET /api/subscriptions
 * List all accessible Azure subscriptions
 */
export function createGetAllSubscriptionsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetAllSubscriptionsQuery();
    const result = await mediator.send(query);
    return res.json(result);
  });
}
