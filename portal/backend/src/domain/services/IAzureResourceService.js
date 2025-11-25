/**
 * Azure Resource Service Interface
 * Defines contract for Azure Resource Graph operations
 */
export class IAzureResourceService {
  /**
   * Query ARM Portal resources with optional filtering
   * @param {Object} options - Query options (environment, blueprintId, etc.)
   * @returns {Promise<Array>} - Array of resources
   */
  async queryArmPortalResources(options) {
    throw new Error("queryArmPortalResources() must be implemented");
  }

  /**
   * Query resources by request ID
   * @param {string} requestId - Request ID to filter by
   * @returns {Promise<Array>} - Array of resources
   */
  async queryResourcesByRequestId(requestId) {
    throw new Error("queryResourcesByRequestId() must be implemented");
  }

  /**
   * Query resource groups by environment
   * @param {string} environment - Environment to filter by
   * @returns {Promise<Array>} - Array of resource groups
   */
  async queryResourceGroupsByEnvironment(environment) {
    throw new Error("queryResourceGroupsByEnvironment() must be implemented");
  }

  /**
   * Get resource by Azure resource ID
   * @param {string} resourceId - Azure resource ID
   * @returns {Promise<object|null>} - Resource object or null if not found
   */
  async getResourceById(resourceId) {
    throw new Error("getResourceById() must be implemented");
  }
}
