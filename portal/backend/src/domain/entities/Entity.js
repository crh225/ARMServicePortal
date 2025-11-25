/**
 * Entity Base Class
 * Provides domain event support for all entities
 */
export class Entity {
  constructor() {
    this._domainEvents = [];
  }

  /**
   * Add a domain event to this entity
   * @param {IDomainEvent} event - The domain event to add
   */
  addDomainEvent(event) {
    this._domainEvents.push(event);
  }

  /**
   * Get all domain events for this entity
   * @returns {IDomainEvent[]} Array of domain events
   */
  getDomainEvents() {
    return [...this._domainEvents];
  }

  /**
   * Clear all domain events for this entity
   */
  clearDomainEvents() {
    this._domainEvents = [];
  }

  /**
   * Check if entity has domain events
   * @returns {boolean}
   */
  hasDomainEvents() {
    return this._domainEvents.length > 0;
  }
}
