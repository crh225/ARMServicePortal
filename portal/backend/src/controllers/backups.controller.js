/**
 * Backups Controller
 * Handles HTTP requests for Terraform state backup operations
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetAllBackupsQuery } from "../application/backups/queries/GetAllBackupsQuery.js";
import { GetBackupsByEnvironmentQuery } from "../application/backups/queries/GetBackupsByEnvironmentQuery.js";

/**
 * GET /api/backups
 * List all Terraform state backups across all environments
 */
export function createGetAllBackupsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const query = new GetAllBackupsQuery(limit);
    const result = await mediator.send(query);
    return res.json(result);
  });
}

/**
 * GET /api/backups/:environment
 * List Terraform state backups for a specific environment
 */
export function createGetBackupsByEnvironmentHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { environment } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const query = new GetBackupsByEnvironmentQuery(environment, limit);
    const result = await mediator.send(query);
    return res.json(result);
  });
}
