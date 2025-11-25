import { IDomainEventHandler } from "../../../domain/events/IDomainEventHandler.js";

/**
 * Handles ResourcePromotedEvent
 * Logs when a resource is promoted between environments
 */
export class ResourcePromotedEventHandler extends IDomainEventHandler {
  async handle(event) {
    console.log(`[Domain Event] Resource promoted:`, {
      sourceJobId: event.sourceJobId,
      fromEnvironment: event.sourceEnvironment,
      toEnvironment: event.targetEnvironment,
      pullRequestUrl: event.pullRequestUrl,
      occurredOn: event.occurredOn
    });
  }
}
