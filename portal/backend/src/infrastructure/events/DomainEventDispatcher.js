/**
 * Domain Event Dispatcher
 * Dispatches domain events to registered handlers
 * Similar to IMediator.Publish in MediatR
 */
export class DomainEventDispatcher {
  constructor() {
    this.handlers = new Map(); // eventName -> array of handler factories
  }

  /**
   * Register a handler for a domain event
   * @param {string} eventName - The event name
   * @param {Function} handlerFactory - Factory function that returns handler instance
   */
  register(eventName, handlerFactory) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName).push(handlerFactory);
  }

  /**
   * Dispatch a domain event to all registered handlers
   * @param {IDomainEvent} event - The domain event
   * @returns {Promise<void>}
   */
  async dispatch(event) {
    const eventName = event.eventName;
    const handlerFactories = this.handlers.get(eventName) || [];

    // Execute all handlers in parallel
    const promises = handlerFactories.map(factory => {
      const handler = factory();
      return handler.handle(event);
    });

    await Promise.all(promises);
  }

  /**
   * Dispatch multiple domain events
   * @param {IDomainEvent[]} events - Array of domain events
   * @returns {Promise<void>}
   */
  async dispatchAll(events) {
    for (const event of events) {
      await this.dispatch(event);
    }
  }
}
