/**
 * Handler for GetNotificationsQuery
 * Retrieves all notifications with counts
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetNotificationsHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the GetNotificationsQuery
   * @param {GetNotificationsQuery} query
   * @returns {Promise<Result>} Notifications with metadata
   */
  async handle(query) {
    try {
      const notifications = await this.notificationRepository.getAll(query.options);
      const total = notifications.length;
      const unreadCount = await this.notificationRepository.getUnreadCount();

      return Result.success({
        notifications: notifications.map(n => n.toDTO()),
        total,
        unreadCount
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
