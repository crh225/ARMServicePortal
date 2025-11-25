/**
 * Handler for GetAllSubscriptionsQuery
 * Retrieves all Azure subscriptions
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetAllSubscriptionsHandler extends IRequestHandler {
  constructor(subscriptionRepository) {
    super();
    this.subscriptionRepository = subscriptionRepository;
  }

  /**
   * Handle the GetAllSubscriptionsQuery
   * @param {GetAllSubscriptionsQuery} query
   * @returns {Promise<Result>} Response with subscriptions and count
   */
  async handle(query) {
    try {
      const subscriptions = await this.subscriptionRepository.getAll();
      const subscriptionDTOs = subscriptions.map(sub => sub.toDTO());

      return Result.success({
        subscriptions: subscriptionDTOs,
        count: subscriptionDTOs.length
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
