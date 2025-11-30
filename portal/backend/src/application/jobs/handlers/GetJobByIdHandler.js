/**
 * Handler for GetJobByIdQuery
 * Retrieves a specific job by ID with validation
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { JobId } from "../../../domain/value-objects/JobId.js";
import { Result } from "../../../domain/common/Result.js";

export class GetJobByIdHandler extends IRequestHandler {
  constructor(jobRepository) {
    super();
    this.jobRepository = jobRepository;
  }

  /**
   * Handle the GetJobByIdQuery
   * @param {GetJobByIdQuery} query
   * @returns {Promise<Result>} Job details
   */
  async handle(query) {
    try {
      // Validate job ID
      const jobId = new JobId(query.jobIdValue);

      // Repository now returns Result
      const result = await this.jobRepository.getById(jobId);
      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }
}
