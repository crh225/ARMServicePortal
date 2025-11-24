/**
 * Command to delete a notification
 */
import { IRequest } from "../../contracts/IRequest.js";

export class DeleteNotificationCommand extends IRequest {
  constructor(id) {
    super();
    this.id = id;
  }
}
