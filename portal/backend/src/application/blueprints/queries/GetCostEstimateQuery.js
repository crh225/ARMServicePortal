/**
 * Query to get cost estimate for a blueprint
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetCostEstimateQuery extends IRequest {
  constructor(blueprintIdString, variables) {
    super();
    this.blueprintIdString = blueprintIdString;
    this.variables = variables;
  }
}
