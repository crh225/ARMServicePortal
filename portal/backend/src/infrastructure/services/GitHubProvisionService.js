/**
 * GitHub Provision Service Implementation
 * Wraps the existing GitHub provision functionality for DDD architecture
 * Returns Result objects following the Result pattern
 */
import { IGitHubProvisionService } from "../../domain/services/IGitHubProvisionService.js";
import { createGitHubRequest } from "../external/github/provision.js";

export class GitHubProvisionService extends IGitHubProvisionService {
  /**
   * Create a GitHub provision request
   * @param {object} request - The provision request
   * @returns {Promise<Result>} Result containing the GitHub request data or error
   */
  async createRequest(request) {
    return await createGitHubRequest(request);
  }
}
