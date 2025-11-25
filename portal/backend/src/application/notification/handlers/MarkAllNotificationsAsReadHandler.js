/**
 * Handler for MarkAllNotificationsAsReadCommand
 * Marks all notifications as read
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class MarkAllNotificationsAsReadHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the MarkAllNotificationsAsReadCommand
   * @param {MarkAllNotificationsAsReadCommand} command
   * @returns {Promise<Result>} Result with count
   */
  async handle(command) {
    try {
      const count = await this.notificationRepository.markAllAsRead();
      return Result.success({ markedCount: count });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
