/**
 * Query to get all notifications
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetNotificationsQuery extends IRequest {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}
