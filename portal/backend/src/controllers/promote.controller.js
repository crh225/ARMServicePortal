import { createPromotionPR } from "../services/github/promote.js";
import { getGitHubRequestByNumber } from "../services/githubProvision.js";

/**
 * Promote a deployed resource to the next environment
 * dev → qa → staging → prod
 */
export async function promoteResource(req, res) {
  const prNumber = Number(req.params.id);

  if (!Number.isInteger(prNumber)) {
    return res.status(400).json({
      error: "Invalid resource ID"
    });
  }

  try {
    // Get the source job/resource details
    const sourceJob = await getGitHubRequestByNumber(prNumber);

    // Validate resource can be promoted
    if (!sourceJob.merged) {
      return res.status(400).json({
        error: "Cannot promote undeployed resource",
        details: "Resource must be merged and deployed before promotion"
      });
    }

    if (!sourceJob.environment) {
      return res.status(400).json({
        error: "Source resource has no environment specified"
      });
    }

    // Determine next environment
    const environmentPath = {
      dev: "qa",
      qa: "staging",
      staging: "prod",
      prod: null
    };

    const targetEnvironment = environmentPath[sourceJob.environment];

    if (!targetEnvironment) {
      return res.status(400).json({
        error: "Cannot promote from production",
        details: "Production is the final environment"
      });
    }

    // Create promotion PR
    const result = await createPromotionPR(
      sourceJob,
      targetEnvironment
    );

    res.json({
      success: true,
      message: `Promotion PR created: ${sourceJob.environment} → ${targetEnvironment}`,
      sourceEnvironment: sourceJob.environment,
      targetEnvironment,
      pr: result
    });
  } catch (err) {
    console.error("Error in promoteResource controller:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: "Failed to create promotion PR",
      details: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
}
