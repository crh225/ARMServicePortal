/**
 * Container Registry Controller
 * Handles container registry operations
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetContainerRepositoriesQuery } from "../application/registry/queries/GetContainerRepositoriesQuery.js";
import { GetContainerTagsQuery } from "../application/registry/queries/GetContainerTagsQuery.js";

export function createGetRepositoriesHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetContainerRepositoriesQuery();
    const result = await mediator.send(query);
    return res.json(result);
  });
}

export function createGetTagsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { repositoryName } = req.params;
    const query = new GetContainerTagsQuery({ repositoryName: decodeURIComponent(repositoryName) });
    const result = await mediator.send(query);
    return res.json(result);
  });
}
