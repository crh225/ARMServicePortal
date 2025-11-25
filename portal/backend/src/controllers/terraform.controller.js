import { GenerateTerraformCodeQuery } from "../application/terraform/queries/GenerateTerraformCodeQuery.js";
import { mediator } from "../infrastructure/di/mediatorContainer.js";

/**
 * Generate Terraform code for an Azure resource
 */
export async function generateTerraformCode(req, res, next) {
  try {
    // Get resource ID from request body (for POST) or query param (for GET)
    const resourceId = req.body?.resourceId || req.query.resourceId;

    if (!resourceId) {
      return res.status(400).json({
        error: "Resource ID is required",
        details: "Provide resourceId in request body or query parameter"
      });
    }

    const query = new GenerateTerraformCodeQuery(resourceId);
    const result = await mediator.send(query);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
