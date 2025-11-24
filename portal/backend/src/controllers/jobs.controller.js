/**
 * Jobs Controller
 * Handles HTTP requests for jobs/requests
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetAllJobsQuery } from "../application/jobs/queries/GetAllJobsQuery.js";
import { GetJobByIdQuery } from "../application/jobs/queries/GetJobByIdQuery.js";

/**
 * GET /api/jobs
 * List all jobs with optional environment filter
 */
export function createListJobsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { environment } = req.query;
    const query = new GetAllJobsQuery({ environment });
    const result = await mediator.send(query);
    return res.json(result);
  });
}

/**
 * GET /api/jobs/:id
 * Get detailed information for a specific job
 */
export function createGetJobByIdHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetJobByIdQuery(req.params.id);
    const result = await mediator.send(query);
    return res.json(result);
  });
}
