/**
 * Resources Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetResourcesQuery } from "../application/resources/queries/GetResourcesQuery.js";
import { GetResourcesByRequestQuery } from "../application/resources/queries/GetResourcesByRequestQuery.js";
import { GetResourceGroupsQuery } from "../application/resources/queries/GetResourceGroupsQuery.js";

export function createGetResourcesHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetResourcesQuery(req.query);
    const result = await mediator.send(query);
    return res.json(result);
  });
}

export function createGetResourcesByRequestHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetResourcesByRequestQuery(req.params.requestId);
    const result = await mediator.send(query);
    return res.json(result);
  });
}

export function createGetResourceGroupsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetResourceGroupsQuery(req.query.environment);
    const result = await mediator.send(query);
    return res.json(result);
  });
}
