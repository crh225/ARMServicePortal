/**
 * Blueprint Repository Interface
 * Defines the contract for blueprint data access operations
 */
export class IBlueprintRepository {
  /**
   * Retrieve a blueprint by its ID
   * @param {string} blueprintId - The blueprint identifier
   * @returns {Promise<Object>} The blueprint object
   * @throws {Error} Method not implemented
   */
  async getById(blueprintId) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieve all publicly available blueprints
   * @returns {Promise<Array>} Array of public blueprint objects
   * @throws {Error} Method not implemented
   */
  async getAllPublic() {
    throw new Error("Method not implemented");
  }

  /**
   * Check if a blueprint exists
   * @param {string} blueprintId - The blueprint identifier
   * @returns {Promise<boolean>} True if blueprint exists, false otherwise
   * @throws {Error} Method not implemented
   */
  async exists(blueprintId) {
    throw new Error("Method not implemented");
  }
}
