/**
 * Command to promote a resource to the next environment
 */
import { IRequest } from "../../contracts/IRequest.js";

export class PromoteResourceCommand extends IRequest {
  constructor(prNumber) {
    super();
    this.prNumber = prNumber;
  }
}
