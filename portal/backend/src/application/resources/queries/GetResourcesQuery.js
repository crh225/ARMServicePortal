/**
 * Query to get resources with filters
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetResourcesQuery extends IRequest {
  constructor({ environment, blueprintId, resourceGroup, subscriptions, skip, top, includeCosts }) {
    super();
    this.environment = environment;
    this.blueprintId = blueprintId;
    this.resourceGroup = resourceGroup;
    this.subscriptions = subscriptions;
    this.skip = skip;
    this.top = top;
    this.includeCosts = includeCosts;
  }
}
