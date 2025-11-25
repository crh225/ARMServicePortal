/**
 * Terraform Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GenerateTerraformCodeQuery } from "../application/terraform/queries/GenerateTerraformCodeQuery.js";
import { mediator } from "../infrastructure/di/mediatorContainer.js";

/**
 * Generate Terraform code for an Azure resource
 */
export const generateTerraformCode = asyncHandler(async (req, res) => {
  // Get resource ID from request body (for POST) or query param (for GET)
  const resourceId = req.body?.resourceId || req.query.resourceId;

  if (!resourceId) {
    return res.status(400).json({
      error: "Resource ID is required",
      details: "Provide resourceId in request body or query parameter"
    });
  }

  // Get useModules parameter (defaults to true for backwards compatibility)
  // Accepts: ?useModules=false or body: { useModules: false }
  const useModulesParam = req.body?.useModules ?? req.query.useModules ?? 'true';
  const useModules = useModulesParam === 'true' || useModulesParam === true;

  const query = new GenerateTerraformCodeQuery(resourceId, useModules);
  const result = await mediator.send(query);

  return res.json(result);
});
