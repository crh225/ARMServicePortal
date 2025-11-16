import { getLatestBlueprints, getBlueprintVersions } from "../config/blueprints.js";

/**
 * Get the catalog of available blueprints
 * Returns only the latest version of each blueprint
 * Filters out internal fields like moduleSource
 */
export function getCatalog(req, res) {
  const latestBlueprints = getLatestBlueprints();

  // Add available versions to each blueprint and filter out internal fields
  const publicBlueprints = latestBlueprints.map((bp) => {
    const { moduleSource, ...rest } = bp;
    return {
      ...rest,
      availableVersions: getBlueprintVersions(bp.id)
    };
  });

  res.json(publicBlueprints);
}
