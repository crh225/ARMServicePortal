/**
 * Destroy Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { DestroyResourceCommand } from "../application/destroy/commands/DestroyResourceCommand.js";

/**
 * POST /api/destroy/:id
 * Create a destroy PR for a deployed resource
 */
export function createDestroyResourceHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const command = new DestroyResourceCommand(req.params.id);
    const result = await mediator.send(command);
    return res.json(result);
  });
}
