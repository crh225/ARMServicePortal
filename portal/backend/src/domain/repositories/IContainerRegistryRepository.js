/**
 * Container Registry Repository Interface
 * Defines the contract for container registry data access operations
 */
export class IContainerRegistryRepository {
  /**
   * Get all repositories in the registry
   * @returns {Promise<Array<string>>} Array of repository names
   * @throws {Error} Method not implemented
   */
  async getRepositories() {
    throw new Error("Method not implemented");
  }

  /**
   * Get all tags for a specific repository
   * @param {string} repositoryName - Name of the repository
   * @returns {Promise<Array<string>>} Array of tag names
   * @throws {Error} Method not implemented
   */
  async getTags(repositoryName) {
    throw new Error("Method not implemented");
  }

  /**
   * Get full image reference for a repository and tag
   * @param {string} repositoryName - Name of the repository
   * @param {string} tag - Tag name
   * @returns {string} Full image reference (e.g., registry.azurecr.io/repo:tag)
   */
  getImageReference(repositoryName, tag) {
    throw new Error("Method not implemented");
  }
}
