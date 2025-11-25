/**
 * GitHub Destroy Repository
 * Implements IDestroyRepository using GitHub destroy service
 */
import { IDestroyRepository } from "../../../domain/repositories/IDestroyRepository.js";
import { createDestroyPR } from "../../external/github/destroy.js";

export class GitHubDestroyRepository extends IDestroyRepository {
  /**
   * Create a destroy PR for a deployed resource
   */
  async createDestroyPR(prNumber) {
    return await createDestroyPR(prNumber);
  }
}
