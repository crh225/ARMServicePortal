/**
 * Job Repository Interface
 * Defines the contract for job data access operations
 */
export class IJobRepository {
  /**
   * Retrieve all jobs with optional filtering
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Array>} Array of job objects
   * @throws {Error} Method not implemented
   */
  async getAll(options = {}) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieve a job by its ID
   * @param {string} jobId - The job identifier
   * @returns {Promise<Object>} The job object
   * @throws {Error} Method not implemented
   */
  async getById(jobId) {
    throw new Error("Method not implemented");
  }

  /**
   * Check if a job exists
   * @param {string} jobId - The job identifier
   * @returns {Promise<boolean>} True if job exists, false otherwise
   * @throws {Error} Method not implemented
   */
  async exists(jobId) {
    throw new Error("Method not implemented");
  }
}
