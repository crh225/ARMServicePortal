/**
 * Handler for GetResourceLogsQuery
 * Retrieves logs from Azure resources with validation
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { ResourceId } from "../../../domain/value-objects/ResourceId.js";
import { Result } from "../../../domain/common/Result.js";

export class GetResourceLogsHandler extends IRequestHandler {
  constructor(logsRepository) {
    super();
    this.logsRepository = logsRepository;
  }

  /**
   * Handle the GetResourceLogsQuery
   * @param {GetResourceLogsQuery} query
   * @returns {Promise<Result>} Logs data
   */
  async handle(query) {
    try {
      // Validate and create ResourceId value object
      const resourceId = new ResourceId(query.resourceIdString);

      // Validate tail parameter
      const tail = query.tail ? parseInt(query.tail, 10) : 100;
      if (isNaN(tail) || tail < 1 || tail > 1000) {
        return Result.validationFailure([{ field: 'tail', message: 'tail must be a number between 1 and 1000' }]);
      }

      // Fetch logs from repository (returns Result)
      const result = await this.logsRepository.getLogs(resourceId, {
        tail,
        timeRange: query.timeRange || '1h'
      });

      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }
}
