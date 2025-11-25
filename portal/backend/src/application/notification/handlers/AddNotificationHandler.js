/**
 * Handler for AddNotificationCommand
 * Creates a new notification
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class AddNotificationHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the AddNotificationCommand
   * @param {AddNotificationCommand} command
   * @returns {Promise<Result>} Created notification
   */
  async handle(command) {
    try {
      const notification = await this.notificationRepository.add(command.data);
      return Result.success(notification);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
