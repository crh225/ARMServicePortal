/**
 * GitHub Provision Service Interface
 * Defines contract for GitHub provisioning operations
 */
export class IGitHubProvisionService {
  /**
   * Create a GitHub provisioning request (branch, file, PR)
   * @param {Object} request - Provision request details
   * @returns {Promise<Object>} - PR details including URL, branch, file path
   */
  async createRequest(request) {
    throw new Error("createRequest() must be implemented");
  }
}
