/**
 * Handler for GetAllJobsQuery
 * Retrieves jobs/requests with optional filtering
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetAllJobsHandler extends IRequestHandler {
  constructor(jobRepository) {
    super();
    this.jobRepository = jobRepository;
  }

  /**
   * Handle the GetAllJobsQuery
   * @param {GetAllJobsQuery} query
   * @returns {Promise<Result>} Jobs list
   */
  async handle(query) {
    try {
      // Normalize environment parameter
      const filterOptions = {
        environment:
          typeof query.environment === "string" && query.environment.length > 0
            ? query.environment
            : undefined
      };

      const jobs = await this.jobRepository.getAll(filterOptions);
      return Result.success(jobs);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
