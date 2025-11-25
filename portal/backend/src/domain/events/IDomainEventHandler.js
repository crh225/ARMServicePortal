/**
 * Domain Event Handler Interface
 * Base class for handling domain events
 * Similar to INotificationHandler in MediatR
 */
export class IDomainEventHandler {
  /**
   * Handle a domain event
   * @param {IDomainEvent} event - The domain event
   * @returns {Promise<void>}
   */
  async handle(event) {
    throw new Error("Method not implemented");
  }
}
