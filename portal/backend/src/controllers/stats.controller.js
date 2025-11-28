/**
 * Stats Controller
 * Handles HTTP requests for homepage statistics
 * Returns cached stats to minimize API calls
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetHomeStatsQuery } from "../application/stats/queries/GetHomeStatsQuery.js";

/**
 * GET /api/stats
 * Get cached homepage statistics
 */
export function createGetHomeStatsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetHomeStatsQuery();
    const result = await mediator.send(query);
    return res.json(result);
  });
}
