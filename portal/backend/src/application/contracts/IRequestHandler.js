/**
 * Base interface for request handlers
 * All handlers that process requests should implement this
 */
export class IRequestHandler {
  /**
   * Handle the request and return a response
   * @param {IRequest} request - The request to handle
   * @returns {Promise<any>} The response
   */
  async handle(request) {
    throw new Error('Method not implemented');
  }
}
