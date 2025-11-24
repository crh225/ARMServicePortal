/**
 * Logs Repository Interface
 * Defines the contract for log data access operations
 */
export class ILogsRepository {
  /**
   * Retrieve logs for a specific resource
   * @param {string} resourceId - The resource identifier
   * @param {Object} options - Query options for filtering and limiting logs
   * @returns {Promise<Object>} Logs data object
   * @throws {Error} Method not implemented
   */
  async getResourceLogs(resourceId, options = {}) {
    throw new Error("Method not implemented");
  }
}
