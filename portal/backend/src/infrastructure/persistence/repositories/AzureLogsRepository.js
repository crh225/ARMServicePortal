/**
 * Azure Logs Repository
 * Implements ILogsRepository using existing Azure log services
 */
import { ILogsRepository } from "../../../domain/repositories/ILogsRepository.js";
import { getResourceLogs } from "../../external/logs/index.js";

export class AzureLogsRepository extends ILogsRepository {
  /**
   * Get logs for a specific resource
   */
  async getLogs(resourceId, options = {}) {
    // Delegate to existing logs service
    // The existing service already handles all the Azure-specific logic
    return await getResourceLogs(resourceId.value, options);
  }
}
