/**
 * Query to get resources for a specific request ID
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetResourcesByRequestQuery extends IRequest {
  constructor(requestId) {
    super();
    this.requestId = requestId;
  }
}
