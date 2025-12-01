/**
 * GitHub Job Repository
 * Implements IJobRepository using GitHub PR services
 * Returns Result objects following the Result pattern
 */
import { IJobRepository } from "../../../domain/repositories/IJobRepository.js";
import { listGitHubRequests, getGitHubRequestByNumber, getGitHubRequestsCount } from "../../external/github/pullRequests.js";

export class GitHubJobRepository extends IJobRepository {
  /**
   * Get all jobs with optional environment filter
   * @param {object} options - Filter options
   * @returns {Promise<Result>} Result containing jobs array or error
   */
  async getAll(options = {}) {
    return await listGitHubRequests(options);
  }

  /**
   * Get count of jobs (faster than getAll for stats)
   * Uses GitHub Search API - single call instead of pagination
   * @param {object} options - Filter options
   * @returns {Promise<Result>} Result containing count number or error
   */
  async getCount(options = {}) {
    return await getGitHubRequestsCount(options);
  }

  /**
   * Get job by ID
   * @param {JobId} jobId - The job ID value object
   * @returns {Promise<Result>} Result containing job data or error
   */
  async getById(jobId) {
    return await getGitHubRequestByNumber(jobId.value);
  }
}
