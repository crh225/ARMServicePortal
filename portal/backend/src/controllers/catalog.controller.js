/**
 * Catalog Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetBlueprintCatalogQuery } from "../application/blueprints/queries/GetBlueprintCatalogQuery.js";

export function createGetCatalogHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetBlueprintCatalogQuery();
    const publicBlueprints = await mediator.send(query);
    return res.json(publicBlueprints);
  });
}
