/**
 * GitHub Provision Service Implementation
 * Wraps the existing GitHub provision functionality for DDD architecture
 */
import { IGitHubProvisionService } from "../../domain/services/IGitHubProvisionService.js";
import { createGitHubRequest } from "../external/github/provision.js";

export class GitHubProvisionService extends IGitHubProvisionService {
  async createRequest(request) {
    return await createGitHubRequest(request);
  }
}
