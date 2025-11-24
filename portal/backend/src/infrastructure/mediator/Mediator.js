/**
 * MediatR-style Mediator Implementation
 * Implements the mediator pattern for decoupled request/response handling
 * Supports pipeline behaviors for cross-cutting concerns
 */
export class Mediator {
  constructor() {
    this.handlers = new Map();
    this.behaviors = [];
  }

  /**
   * Register a handler for a specific request type
   * @param {string} requestName - The name/type of the request
   * @param {Function} handlerFactory - Factory function that returns a handler instance
   */
  register(requestName, handlerFactory) {
    this.handlers.set(requestName, handlerFactory);
  }

  /**
   * Add a pipeline behavior
   * Behaviors are executed in the order they are added
   * @param {IPipelineBehavior} behavior - The behavior instance
   */
  addBehavior(behavior) {
    this.behaviors.push(behavior);
  }

  /**
   * Send a request to its handler and return the response
   * Executes through the pipeline of behaviors before reaching the handler
   * @param {IRequest} request - The request object
   * @returns {Promise<any>} The response from the handler
   */
  async send(request) {
    const requestName = request.constructor.name;
    const handlerFactory = this.handlers.get(requestName);

    if (!handlerFactory) {
      throw new Error(`No handler registered for request type: ${requestName}`);
    }

    // Build the pipeline: behaviors + handler
    // Execute behaviors in order, ending with the actual handler
    const handler = handlerFactory();

    // Create the handler invocation as the final step
    const handlerInvocation = async () => await handler.handle(request);

    // Build pipeline from behaviors (reverse order so they execute in correct order)
    const pipeline = this.behaviors.reduceRight(
      (next, behavior) => {
        return async () => await behavior.handle(request, next);
      },
      handlerInvocation
    );

    // Execute the pipeline
    return await pipeline();
  }

  /**
   * Check if a handler is registered for a request type
   * @param {string} requestName - The name/type of the request
   * @returns {boolean}
   */
  hasHandler(requestName) {
    return this.handlers.has(requestName);
  }

  /**
   * Get all registered request types
   * @returns {string[]}
   */
  getRegisteredRequests() {
    return Array.from(this.handlers.keys());
  }
}
