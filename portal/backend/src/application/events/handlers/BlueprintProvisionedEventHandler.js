import { IDomainEventHandler } from "../../../domain/events/IDomainEventHandler.js";

/**
 * Handles BlueprintProvisionedEvent
 * Logs when a blueprint is provisioned (can be extended for notifications, auditing, etc.)
 */
export class BlueprintProvisionedEventHandler extends IDomainEventHandler {
  async handle(event) {
    console.log(`[Domain Event] Blueprint provisioned:`, {
      blueprintId: event.blueprintId,
      environment: event.environment,
      pullRequestUrl: event.pullRequestUrl,
      createdBy: event.createdBy,
      occurredOn: event.occurredOn
    });
  }
}
