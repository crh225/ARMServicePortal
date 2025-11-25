/**
 * Pricing Repository Interface
 * Defines the contract for cost estimation operations
 */
export class IPricingRepository {
  /**
   * Calculate cost estimate for a blueprint configuration
   * @param {string} blueprintId - The blueprint identifier
   * @param {Object} variables - Blueprint configuration variables
   * @returns {Promise<Object>} Cost estimate object
   * @throws {Error} Method not implemented
   */
  async getCostEstimate(blueprintId, variables) {
    throw new Error("Method not implemented");
  }
}
