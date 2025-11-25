/**
 * Handler for DeleteNotificationCommand
 * Deletes a specific notification
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class DeleteNotificationHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the DeleteNotificationCommand
   * @param {DeleteNotificationCommand} command
   * @returns {Promise<Result>} Success result
   */
  async handle(command) {
    try {
      const deleted = await this.notificationRepository.delete(command.id);
      if (!deleted) {
        return Result.notFound('Notification not found');
      }
      return Result.success({ success: true });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
