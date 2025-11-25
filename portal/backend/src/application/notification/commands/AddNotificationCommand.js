/**
 * Command to add a new notification
 */
import { IRequest } from "../../contracts/IRequest.js";

export class AddNotificationCommand extends IRequest {
  constructor(data) {
    super();
    this.data = data;
  }
}
