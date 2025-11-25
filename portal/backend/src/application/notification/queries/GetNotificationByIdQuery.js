/**
 * Query to get a specific notification by ID
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetNotificationByIdQuery extends IRequest {
  constructor(id) {
    super();
    this.id = id;
  }
}
