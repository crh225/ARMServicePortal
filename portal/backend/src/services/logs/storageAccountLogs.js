/**
 * Fetch logs from Azure Storage Accounts using Log Analytics
 */
import { LogsQueryClient } from "@azure/monitor-query";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Get logs from a Storage Account via Log Analytics
 * Requires diagnostic settings to be enabled on the storage account
 * @param {Object} params - Parameters
 * @param {string} params.resourceName - Storage account name
 * @param {number} params.tail - Number of lines to return (default: 100)
 * @param {string} params.timeRange - Time range (default: '1h')
 * @returns {Promise<Array>} Array of log entries
 */
export async function getStorageAccountLogs({
  resourceName,
  tail = 100,
  timeRange = '1h'
}) {
  try {
    // Read workspace ID at runtime
    const workspaceId = process.env.LOG_ANALYTICS_WORKSPACE_ID;

    if (!workspaceId) {
      throw new Error('LOG_ANALYTICS_WORKSPACE_ID environment variable not set');
    }

    const credential = new DefaultAzureCredential();
    const logsClient = new LogsQueryClient(credential);

    // KQL query to get storage operations (blob, queue, table, file)
    const query = `
      StorageBlobLogs
      | union StorageFileLogs, StorageQueueLogs, StorageTableLogs
      | where AccountName == "${resourceName}"
      | project TimeGenerated, OperationName, StatusCode, CallerIpAddress, Uri, AuthenticationType
      | order by TimeGenerated desc
      | limit ${tail}
    `;

    const result = await logsClient.queryWorkspace(
      workspaceId,
      query,
      { duration: timeRange }
    );

    if (result.status !== 'Success' || !result.tables || result.tables.length === 0) {
      return [];
    }

    const table = result.tables[0];
    const logs = [];

    for (const row of table.rows) {
      const statusCode = row[2];
      const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warning' : 'info';

      logs.push({
        timestamp: row[0], // TimeGenerated
        message: `${row[1]} - ${row[4] || 'N/A'} (${statusCode})`, // OperationName, Uri, StatusCode
        source: row[3] || 'storage', // CallerIpAddress
        level: level
      });
    }

    return logs.reverse(); // Return in chronological order

  } catch (error) {
    console.error('Failed to fetch Storage Account logs:', error.message);
    throw new Error(`Unable to fetch logs: ${error.message}`);
  }
}
