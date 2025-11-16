import { getBlueprintById } from "../config/blueprints.js";
import { createGitHubRequest } from "../services/githubProvision.js";

/**
 * Handle blueprint provisioning requests
 * Creates a GitHub PR with Terraform configuration
 */
export async function provisionBlueprint(req, res) {
  const { blueprintId, variables, environment, moduleName } = req.body || {};

  // Validation
  if (!blueprintId || !variables) {
    return res.status(400).json({
      error: "blueprintId and variables are required"
    });
  }

  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    return res.status(404).json({
      error: "Unknown blueprintId"
    });
  }

  const envValue = environment || variables.environment || "dev";

  try {
    const gh = await createGitHubRequest({
      environment: envValue,
      blueprintId,
      variables,
      moduleName
    });

    return res.status(202).json({
      status: "submitted",
      pullRequestUrl: gh.pullRequestUrl,
      branchName: gh.branchName,
      filePath: gh.filePath
    });
  } catch (err) {
    console.error("Error in provision controller:", err);
    return res.status(500).json({
      error: "Failed to create GitHub request",
      details: err.message
    });
  }
}
