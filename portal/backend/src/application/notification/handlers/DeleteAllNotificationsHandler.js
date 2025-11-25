/**
 * Handler for DeleteAllNotificationsCommand
 * Deletes all notifications
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class DeleteAllNotificationsHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the DeleteAllNotificationsCommand
   * @param {DeleteAllNotificationsCommand} command
   * @returns {Promise<Result>} Result with count
   */
  async handle(command) {
    try {
      const count = await this.notificationRepository.deleteAll();
      return Result.success({ deletedCount: count });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
