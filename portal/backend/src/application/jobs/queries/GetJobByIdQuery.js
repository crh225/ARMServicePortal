/**
 * Query to get a specific job by ID
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetJobByIdQuery extends IRequest {
  constructor(jobIdValue) {
    super();
    this.jobIdValue = jobIdValue;
  }
}
