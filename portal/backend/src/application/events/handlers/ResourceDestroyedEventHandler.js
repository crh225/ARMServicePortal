import { IDomainEventHandler } from "../../../domain/events/IDomainEventHandler.js";

/**
 * Handles ResourceDestroyedEvent
 * Logs when a resource is destroyed
 */
export class ResourceDestroyedEventHandler extends IDomainEventHandler {
  async handle(event) {
    console.log(`[Domain Event] Resource destroyed:`, {
      jobId: event.jobId,
      pullRequestUrl: event.pullRequestUrl,
      occurredOn: event.occurredOn
    });
  }
}
