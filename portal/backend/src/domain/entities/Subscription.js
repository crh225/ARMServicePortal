/**
 * Subscription Domain Entity
 * Represents an Azure subscription
 */
export class Subscription {
  constructor({ id, name, state, tenantId }) {
    this.id = id;
    this.name = name;
    this.state = state;
    this.tenantId = tenantId;
  }

  /**
   * Check if subscription is active/enabled
   */
  get isActive() {
    return this.state === 'Enabled';
  }

  /**
   * Convert to DTO for API response
   */
  toDTO() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      tenantId: this.tenantId
    };
  }
}
