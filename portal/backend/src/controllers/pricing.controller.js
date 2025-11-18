import { estimateBlueprintCost } from "../services/azurePricing.js";
import { getBlueprintById } from "../config/blueprints.js";

/**
 * Get cost estimate for a blueprint configuration
 */
export async function getCostEstimate(req, res) {
  const { blueprintId, variables } = req.body || {};

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

  try {
    const estimate = await estimateBlueprintCost(blueprintId, variables, blueprint);
    res.json(estimate);
  } catch (err) {
    console.error("Error generating cost estimate:", err);
    res.status(500).json({
      error: "Failed to generate cost estimate",
      details: err.message
    });
  }
}
