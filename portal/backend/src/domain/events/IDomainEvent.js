/**
 * Domain Event Interface
 * Base class for all domain events in the system
 * Domain events represent something significant that happened in the domain
 */
export class IDomainEvent {
  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  get eventName() {
    return this.constructor.name;
  }
}
