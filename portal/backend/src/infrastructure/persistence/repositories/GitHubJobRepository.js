/**
 * GitHub Job Repository
 * Implements IJobRepository using GitHub PR services
 */
import { IJobRepository } from "../../../domain/repositories/IJobRepository.js";
import { listGitHubRequests, getGitHubRequestByNumber } from "../../external/github/pullRequests.js";

export class GitHubJobRepository extends IJobRepository {
  /**
   * Get all jobs with optional environment filter
   */
  async getAll(options = {}) {
    return await listGitHubRequests(options);
  }

  /**
   * Get job by ID
   */
  async getById(jobId) {
    return await getGitHubRequestByNumber(jobId.value);
  }
}
