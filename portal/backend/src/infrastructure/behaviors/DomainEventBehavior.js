import { IPipelineBehavior } from "../../application/contracts/IPipelineBehavior.js";

/**
 * Domain Event Pipeline Behavior
 * Dispatches domain events after handler execution
 * Should run after the handler completes successfully
 */
export class DomainEventBehavior extends IPipelineBehavior {
  constructor(eventDispatcher) {
    super();
    this.eventDispatcher = eventDispatcher;
  }

  async handle(request, next) {
    // Execute the handler first
    const response = await next();

    // Check if response contains an entity with domain events
    if (response && typeof response === 'object') {
      // Handle single entity
      if (response.hasDomainEvents && typeof response.hasDomainEvents === 'function') {
        if (response.hasDomainEvents()) {
          const events = response.getDomainEvents();
          await this.eventDispatcher.dispatchAll(events);
          response.clearDomainEvents();
        }
      }

      // Handle entity inside result object (common pattern)
      if (response.entity && response.entity.hasDomainEvents && typeof response.entity.hasDomainEvents === 'function') {
        if (response.entity.hasDomainEvents()) {
          const events = response.entity.getDomainEvents();
          await this.eventDispatcher.dispatchAll(events);
          response.entity.clearDomainEvents();
        }
      }
    }

    return response;
  }
}
