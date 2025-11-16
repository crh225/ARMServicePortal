import { BLUEPRINTS } from "../config/blueprints.js";

/**
 * Get the catalog of available blueprints
 * Filters out internal fields like moduleSource
 */
export function getCatalog(req, res) {
  const publicBlueprints = BLUEPRINTS.map(({ moduleSource, ...rest }) => rest);
  res.json(publicBlueprints);
}
