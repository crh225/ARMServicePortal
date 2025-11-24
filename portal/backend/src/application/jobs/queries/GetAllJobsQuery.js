/**
 * Query to get all jobs with optional filtering
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetAllJobsQuery extends IRequest {
  constructor(options = {}) {
    super();
    this.environment = options.environment;
  }
}
