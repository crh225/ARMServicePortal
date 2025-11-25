/**
 * Fetch logs from Azure Key Vault using Log Analytics
 */
import { LogsQueryClient } from "@azure/monitor-query";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Get logs from a Key Vault via Log Analytics
 * Requires diagnostic settings to be enabled on the key vault
 * @param {Object} params - Parameters
 * @param {string} params.resourceName - Key vault name
 * @param {number} params.tail - Number of lines to return (default: 100)
 * @param {string} params.timeRange - Time range (default: '1h')
 * @returns {Promise<Array>} Array of log entries
 */
export async function getKeyVaultLogs({
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

    // KQL query to get Key Vault audit events
    const query = `
      AzureDiagnostics
      | where ResourceProvider == "MICROSOFT.KEYVAULT"
      | where Resource == "${resourceName.toUpperCase()}"
      | where Category == "AuditEvent"
      | project TimeGenerated, OperationName, ResultSignature, CallerIPAddress, identity_claim_appid_g, requestUri_s
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
      const resultSignature = row[2] || '';
      const resultLower = resultSignature.toLowerCase();

      // Determine log level based on result signature
      let level = 'info';
      if (resultLower.includes('unauthorized') || resultLower.includes('forbidden') ||
          resultLower.includes('error') || resultLower.includes('failed')) {
        level = 'error';
      } else if (resultLower.includes('notfound') || resultLower.includes('conflict')) {
        level = 'warning';
      }

      logs.push({
        timestamp: row[0], // TimeGenerated
        message: `${row[1]} - ${resultSignature}`, // OperationName - ResultSignature
        source: row[3] || 'keyvault', // CallerIPAddress
        level: level
      });
    }

    return logs.reverse(); // Return in chronological order

  } catch (error) {
    console.error('Failed to fetch Key Vault logs:', error.message);
    throw new Error(`Unable to fetch logs: ${error.message}`);
  }
}
