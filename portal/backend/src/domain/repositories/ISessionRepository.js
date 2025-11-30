/**
 * Session Repository Interface
 * Defines the contract for session data access operations
 */
export class ISessionRepository {
  /**
   * Create a new session
   * @param {string} token - Session token
   * @param {Object} data - Session data (user info, access token, expiration)
   * @returns {Promise<void>}
   * @throws {Error} Method not implemented
   */
  async create(token, data) {
    throw new Error("Method not implemented");
  }

  /**
   * Get a session by token
   * @param {string} token - Session token
   * @returns {Promise<Object|null>} Session data or null if not found
   * @throws {Error} Method not implemented
   */
  async get(token) {
    throw new Error("Method not implemented");
  }

  /**
   * Delete a session by token
   * @param {string} token - Session token
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} Method not implemented
   */
  async delete(token) {
    throw new Error("Method not implemented");
  }

  /**
   * Check if a session exists and is not expired
   * @param {string} token - Session token
   * @returns {Promise<boolean>} True if valid session exists
   * @throws {Error} Method not implemented
   */
  async isValid(token) {
    throw new Error("Method not implemented");
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions cleaned up
   * @throws {Error} Method not implemented
   */
  async cleanupExpired() {
    throw new Error("Method not implemented");
  }
}
