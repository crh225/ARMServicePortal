/**
 * GitHub Promote Service Interface
 * Defines contract for GitHub promotion operations
 */
export class IGitHubPromoteService {
  /**
   * Create a promotion PR to promote a resource to the next environment
   * @param {Object} sourceJob - Source job/resource
   * @param {string} targetEnvironment - Target environment
   * @returns {Promise<Object>} - Created PR details
   */
  async createPromotionPR(sourceJob, targetEnvironment) {
    throw new Error("createPromotionPR() must be implemented");
  }
}
