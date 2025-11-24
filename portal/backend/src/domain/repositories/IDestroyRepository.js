/**
 * Destroy Repository Interface
 * Defines the contract for resource destruction operations
 */
export class IDestroyRepository {
  /**
   * Create a destroy request for a job
   * @param {string} jobId - The job identifier
   * @returns {Promise<Object>} Destroy request result object
   * @throws {Error} Method not implemented
   */
  async createDestroyRequest(jobId) {
    throw new Error("Method not implemented");
  }
}
