/**
 * Handler for MarkNotificationAsReadCommand
 * Marks a notification as read
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class MarkNotificationAsReadHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the MarkNotificationAsReadCommand
   * @param {MarkNotificationAsReadCommand} command
   * @returns {Promise<Result>} Updated notification DTO
   */
  async handle(command) {
    try {
      const notification = await this.notificationRepository.markAsRead(command.id);
      if (!notification) {
        return Result.notFound('Notification not found');
      }
      return Result.success(notification.toDTO());
    } catch (error) {
      return Result.failure(error);
    }
  }
}
