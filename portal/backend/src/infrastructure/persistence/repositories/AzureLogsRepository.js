/**
 * Azure Logs Repository
 * Implements ILogsRepository using existing Azure log services
 * Returns Result objects following the Result pattern
 */
import { ILogsRepository } from "../../../domain/repositories/ILogsRepository.js";
import { getResourceLogs } from "../../external/logs/index.js";

export class AzureLogsRepository extends ILogsRepository {
  /**
   * Get logs for a specific resource
   * @param {ResourceId} resourceId - The resource ID value object
   * @param {object} options - Log retrieval options
   * @returns {Promise<Result>} Result containing logs data or error
   */
  async getLogs(resourceId, options = {}) {
    // Delegate to existing logs service (returns Result)
    return await getResourceLogs(resourceId.value, options);
  }
}
