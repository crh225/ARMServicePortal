import { getBlueprintById } from "../config/blueprints.js";
import { createGitHubRequest } from "../services/githubProvision.js";
import { validatePolicies, applyAutoFill } from "../services/policyEngine.js";

/**
 * Handle blueprint provisioning requests
 * Creates a GitHub PR with Terraform configuration
 */
export async function provisionBlueprint(req, res) {
  const { blueprintId, blueprintVersion, variables, environment, moduleName } = req.body || {};

  // Validation
  if (!blueprintId || !variables) {
    return res.status(400).json({
      error: "blueprintId and variables are required"
    });
  }

  const blueprint = getBlueprintById(blueprintId, blueprintVersion);
  if (!blueprint) {
    return res.status(404).json({
      error: blueprintVersion
        ? `Unknown blueprint or version: ${blueprintId}@${blueprintVersion}`
        : `Unknown blueprintId: ${blueprintId}`
    });
  }

  const envValue = environment || variables.environment || "dev";

  // Run policy validation
  const policyResult = validatePolicies({
    blueprintId,
    environment: envValue,
    variables,
    blueprint
  });

  // If there are policy errors, return them
  if (!policyResult.valid) {
    return res.status(400).json({
      error: "Policy validation failed",
      policyErrors: policyResult.errors,
      policyWarnings: policyResult.warnings
    });
  }

  // Apply auto-filled values
  const finalVariables = applyAutoFill(variables, policyResult.autoFilled);

  try {
    const gh = await createGitHubRequest({
      environment: envValue,
      blueprintId,
      blueprintVersion: blueprint.version,
      variables: finalVariables,
      moduleName
    });

    return res.status(202).json({
      status: "submitted",
      pullRequestUrl: gh.pullRequestUrl,
      branchName: gh.branchName,
      filePath: gh.filePath,
      blueprintVersion: blueprint.version,
      policyWarnings: policyResult.warnings.length > 0 ? policyResult.warnings : undefined,
      autoFilled: Object.keys(policyResult.autoFilled).length > 0 ? policyResult.autoFilled : undefined
    });
  } catch (err) {
    console.error("Error in provision controller:", err);
    return res.status(500).json({
      error: "Failed to create GitHub request",
      details: err.message
    });
  }
}
