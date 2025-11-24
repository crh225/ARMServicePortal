/**
 * Handler for GetNotificationByIdQuery
 * Retrieves a specific notification by ID
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetNotificationByIdHandler extends IRequestHandler {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  /**
   * Handle the GetNotificationByIdQuery
   * @param {GetNotificationByIdQuery} query
   * @returns {Promise<Result>} Notification DTO
   */
  async handle(query) {
    try {
      const notification = await this.notificationRepository.getById(query.id);
      if (!notification) {
        return Result.notFound('Notification not found');
      }
      return Result.success(notification.toDTO());
    } catch (error) {
      return Result.failure(error);
    }
  }
}
