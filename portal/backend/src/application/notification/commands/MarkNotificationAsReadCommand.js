/**
 * Command to mark a notification as read
 */
import { IRequest } from "../../contracts/IRequest.js";

export class MarkNotificationAsReadCommand extends IRequest {
  constructor(id) {
    super();
    this.id = id;
  }
}
