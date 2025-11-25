/**
 * Base interface for requests (Commands/Queries)
 * All requests that go through the mediator should implement this
 */
export class IRequest {
  /**
   * The type/name of this request
   * Used for handler registration and lookup
   */
  get requestName() {
    return this.constructor.name;
  }
}
