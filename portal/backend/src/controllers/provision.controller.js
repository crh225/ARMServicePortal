/**
 * Provision Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ProvisionBlueprintCommand } from "../application/provision/commands/ProvisionBlueprintCommand.js";

export function createProvisionBlueprintHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { blueprintId, blueprintVersion, variables, environment, moduleName } = req.body || {};

    // Extract environment from variables if not provided at top level
    const envValue = environment || variables?.environment;

    const command = new ProvisionBlueprintCommand({
      blueprintId,
      blueprintVersion,
      variables,
      environment: envValue,
      moduleName,
      createdBy: req.user?.login || null
    });

    const result = await mediator.send(command);
    return res.status(202).json(result);
  });
}
