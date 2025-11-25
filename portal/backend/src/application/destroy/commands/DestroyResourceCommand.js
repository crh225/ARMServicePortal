/**
 * Command to destroy a deployed resource
 */
import { IRequest } from "../../contracts/IRequest.js";

export class DestroyResourceCommand extends IRequest {
  constructor(prNumberValue) {
    super();
    this.prNumberValue = prNumberValue;
  }
}
