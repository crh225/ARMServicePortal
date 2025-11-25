/**
 * Backup Repository Interface
 * Defines the contract for backup data access operations
 */
export class IBackupRepository {
  /**
   * Retrieve all backups with optional limit
   * @param {number} limit - Maximum number of backups to retrieve
   * @returns {Promise<Array>} Array of backup objects
   * @throws {Error} Method not implemented
   */
  async getAll(limit = 10) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieve backups for a specific environment
   * @param {string} environment - The environment identifier
   * @param {number} limit - Maximum number of backups to retrieve
   * @returns {Promise<Array>} Array of backup objects for the environment
   * @throws {Error} Method not implemented
   */
  async getByEnvironment(environment, limit = 10) {
    throw new Error("Method not implemented");
  }
}
