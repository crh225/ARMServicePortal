/**
 * Query to get logs from Azure resources
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetResourceLogsQuery extends IRequest {
  constructor(resourceIdString, options = {}) {
    super();
    this.resourceIdString = resourceIdString;
    this.tail = options.tail;
    this.timeRange = options.timeRange;
  }
}
