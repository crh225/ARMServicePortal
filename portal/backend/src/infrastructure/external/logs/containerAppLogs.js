/**
 * Fetch logs from Azure Container Apps using Log Analytics
 */
import { LogsQueryClient } from "@azure/monitor-query";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Get logs from a Container App via Log Analytics
 * @param {Object} params - Parameters
 * @param {string} params.resourceName - Container app name
 * @param {number} params.tail - Number of lines to return (default: 100)
 * @param {string} params.timeRange - Time range (default: '1h')
 * @returns {Promise<Array>} Array of log entries
 */
export async function getContainerAppLogs({
  resourceName,
  tail = 100,
  timeRange = '1h'
}) {
  try {
    // Read workspace ID at runtime (not at module load time)
    const workspaceId = process.env.LOG_ANALYTICS_WORKSPACE_ID;

    if (!workspaceId) {
      throw new Error('LOG_ANALYTICS_WORKSPACE_ID environment variable not set');
    }

    const credential = new DefaultAzureCredential();
    const logsClient = new LogsQueryClient(credential);

    // KQL query to get container console logs
    const query = `
      ContainerAppConsoleLogs_CL
      | where ContainerAppName_s == "${resourceName}"
      | project TimeGenerated, Log_s, ContainerName_s, LogLevel_s = "info"
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
      logs.push({
        timestamp: row[0], // TimeGenerated
        message: row[1],   // Log_s
        source: row[2] || 'container', // ContainerName_s
        level: row[3] || inferLogLevel(row[1]) // LogLevel_s
      });
    }

    return logs.reverse(); // Return in chronological order

  } catch (error) {
    console.error('Failed to fetch Container App logs:', error.message);
    throw new Error(`Unable to fetch logs: ${error.message}`);
  }
}

/**
 * Infer log level from log message
 * @param {string} message - Log message
 * @returns {string} Log level
 */
function inferLogLevel(message) {
  if (!message) return 'info';
  const lower = message.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'error';
  if (lower.includes('warn')) return 'warning';
  return 'info';
}
