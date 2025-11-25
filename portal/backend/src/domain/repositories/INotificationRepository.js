/**
 * Notification Repository Interface
 * Defines the contract for notification data access operations
 */
export class INotificationRepository {
  /**
   * Add a new notification
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} The created notification object
   * @throws {Error} Method not implemented
   */
  async add(data) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieve all notifications with optional filtering
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Array>} Array of notification objects
   * @throws {Error} Method not implemented
   */
  async getAll(options = {}) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieve a notification by its ID
   * @param {string} id - The notification identifier
   * @returns {Promise<Object>} The notification object
   * @throws {Error} Method not implemented
   */
  async getById(id) {
    throw new Error("Method not implemented");
  }

  /**
   * Mark a notification as read
   * @param {string} id - The notification identifier
   * @returns {Promise<Object>} The updated notification object
   * @throws {Error} Method not implemented
   */
  async markAsRead(id) {
    throw new Error("Method not implemented");
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   * @throws {Error} Method not implemented
   */
  async markAllAsRead() {
    throw new Error("Method not implemented");
  }

  /**
   * Delete a notification by its ID
   * @param {string} id - The notification identifier
   * @returns {Promise<void>}
   * @throws {Error} Method not implemented
   */
  async delete(id) {
    throw new Error("Method not implemented");
  }

  /**
   * Delete all notifications
   * @returns {Promise<void>}
   * @throws {Error} Method not implemented
   */
  async deleteAll() {
    throw new Error("Method not implemented");
  }
}
