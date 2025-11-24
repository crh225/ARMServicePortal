/**
 * Logs Controller
 * Handles HTTP requests for fetching Azure resource logs
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetResourceLogsQuery } from "../application/logs/queries/GetResourceLogsQuery.js";

/**
 * GET /api/logs
 * Fetch logs for a specific resource
 */
export function createGetResourceLogsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { resourceId, tail, timeRange } = req.query;

    if (!resourceId) {
      return res.status(400).json({
        error: "Missing required parameter: resourceId"
      });
    }

    const query = new GetResourceLogsQuery(resourceId, {
      tail,
      timeRange
    });
    const result = await mediator.send(query);
    return res.json(result);
  });
}
