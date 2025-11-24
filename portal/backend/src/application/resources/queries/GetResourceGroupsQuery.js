/**
 * Query to get resource groups filtered by environment
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetResourceGroupsQuery extends IRequest {
  constructor(environment) {
    super();
    this.environment = environment;
  }
}
