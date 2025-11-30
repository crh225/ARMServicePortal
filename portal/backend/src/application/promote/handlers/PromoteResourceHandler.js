/**
 * Handler for PromoteResourceCommand
 * Orchestrates resource promotion with validation
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Job } from "../../../domain/entities/Job.js";
import { JobId } from "../../../domain/value-objects/JobId.js";
import { PromotionRequest } from "../../../domain/entities/PromotionRequest.js";
import { Result } from "../../../domain/common/Result.js";

export class PromoteResourceHandler extends IRequestHandler {
  constructor(jobRepository, policyService, gitHubPromoteService) {
    super();
    this.jobRepository = jobRepository;
    this.policyService = policyService;
    this.gitHubPromoteService = gitHubPromoteService;
  }

  /**
   * Handle the PromoteResourceCommand
   * @param {PromoteResourceCommand} command
   * @returns {Promise<Result>} Promotion result
   */
  async handle(command) {
    try {
      if (!Number.isInteger(command.prNumber)) {
        return Result.validationFailure([{ field: 'prNumber', message: 'Invalid resource ID' }]);
      }

      // Create JobId value object
      const jobId = new JobId(command.prNumber);

      // Get the source job/resource details (returns Result)
      const sourceJobResult = await this.jobRepository.getById(jobId);
      if (sourceJobResult.isFailure) {
        return sourceJobResult;
      }
      const sourceJobData = sourceJobResult.value;

      // Create Job entity with business logic
      const sourceJob = new Job(sourceJobData);

      // Create PromotionRequest entity
      const promotionRequest = new PromotionRequest({
        sourceJob,
        targetEnvironment: null // Will be determined by validation
      });

      // Validate promotion (entity handles validation logic)
      promotionRequest.validate();

      // Validate policies (entity handles validation logic)
      promotionRequest.validatePolicies(this.policyService);

      // Create promotion PR
      const result = await this.gitHubPromoteService.createPromotionPR(
        sourceJobData, // GitHub service expects plain object
        promotionRequest.targetEnvironment
      );

      // Mark as submitted (entity handles state change)
      promotionRequest.markAsSubmitted(result);

      return Result.success({
        ...promotionRequest.toResult(),
        entity: promotionRequest
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
