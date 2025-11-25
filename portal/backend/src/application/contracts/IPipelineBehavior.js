/**
 * Pipeline Behavior Interface
 * Inspired by MediatR's IPipelineBehavior<TRequest, TResponse>
 * Allows cross-cutting concerns (validation, logging, etc.) to wrap handler execution
 */
export class IPipelineBehavior {
  /**
   * Handle the request and invoke the next behavior in the pipeline
   * @param {IRequest} request - The request object
   * @param {Function} next - Function to invoke the next behavior/handler
   * @returns {Promise<any>} The response from the handler
   */
  async handle(request, next) {
    throw new Error("Method not implemented");
  }
}
