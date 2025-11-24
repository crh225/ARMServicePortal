/**
 * GitHub Promote Service Implementation
 * Wraps the existing GitHub promote functionality for DDD architecture
 */
import { IGitHubPromoteService } from "../../domain/services/IGitHubPromoteService.js";
import { createPromotionPR } from "../external/github/promote.js";

export class GitHubPromoteService extends IGitHubPromoteService {
  async createPromotionPR(sourceJob, targetEnvironment) {
    return await createPromotionPR(sourceJob, targetEnvironment);
  }
}
