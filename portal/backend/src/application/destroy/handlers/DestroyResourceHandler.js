/**
 * Handler for DestroyResourceCommand
 * Creates a destroy PR for a deployed resource
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { JobId } from "../../../domain/value-objects/JobId.js";
import { Job } from "../../../domain/entities/Job.js";
import { Result } from "../../../domain/common/Result.js";

export class DestroyResourceHandler extends IRequestHandler {
  constructor(destroyRepository) {
    super();
    this.destroyRepository = destroyRepository;
  }

  /**
   * Handle the DestroyResourceCommand
   * @param {DestroyResourceCommand} command
   * @returns {Promise<Result>} Destroy PR result
   */
  async handle(command) {
    try {
      // Validate PR number using JobId (same validation)
      const prNumber = new JobId(command.prNumberValue);

      // Create destroy PR
      const result = await this.destroyRepository.createDestroyPR(prNumber.value);

      // Create Job entity and raise domain event
      const job = new Job({ prNumber: prNumber.value });
      job.markAsDestroyed(result.pullRequestUrl);

      return Result.success({
        success: true,
        message: "Destroy PR created successfully",
        pr: result,
        entity: job
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
