/**
 * Command to mark all notifications as read
 */
import { IRequest } from "../../contracts/IRequest.js";

export class MarkAllNotificationsAsReadCommand extends IRequest {
  constructor() {
    super();
  }
}
