/**
 * Promote Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { PromoteResourceCommand } from "../application/promote/commands/PromoteResourceCommand.js";

export function createPromoteResourceHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const prNumber = Number(req.params.id);
    const command = new PromoteResourceCommand(prNumber);
    const result = await mediator.send(command);
    return res.json(result);
  });
}
