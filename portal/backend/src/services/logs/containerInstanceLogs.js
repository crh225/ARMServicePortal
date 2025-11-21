/**
 * Fetch logs from Azure Container Instances
 */
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Get logs from a Container Instance
 * @param {Object} params - Parameters
 * @param {string} params.subscriptionId - Subscription ID
 * @param {string} params.resourceGroup - Resource group name
 * @param {string} params.resourceName - Container group name
 * @param {number} params.tail - Number of lines to return (default: 100)
 * @returns {Promise<Array>} Array of log entries
 */
export async function getContainerInstanceLogs({
  subscriptionId,
  resourceGroup,
  resourceName,
  tail = 100
}) {
  try {
    const credential = new DefaultAzureCredential();
    const client = new ContainerInstanceManagementClient(credential, subscriptionId);

    // Get container group details to find container name
    const containerGroup = await client.containerGroups.get(resourceGroup, resourceName);

    if (!containerGroup.containers || containerGroup.containers.length === 0) {
      return [];
    }

    // Get logs from the first container (most common case)
    const containerName = containerGroup.containers[0].name;

    const logsResponse = await client.containers.listLogs(
      resourceGroup,
      resourceName,
      containerName,
      { tail }
    );

    if (!logsResponse.content) {
      return [];
    }

    // Parse log lines and add timestamps (ACI doesn't provide structured logs)
    const logLines = logsResponse.content.split('\n').filter(line => line.trim());

    return logLines.map((line, index) => ({
      timestamp: new Date(Date.now() - (logLines.length - index) * 1000).toISOString(),
      message: line,
      level: inferLogLevel(line),
      source: 'container'
    }));

  } catch (error) {
    console.error('Failed to fetch Container Instance logs:', error.message);
    throw new Error(`Unable to fetch logs: ${error.message}`);
  }
}

/**
 * Infer log level from log message
 * @param {string} message - Log message
 * @returns {string} Log level
 */
function inferLogLevel(message) {
  const lower = message.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'error';
  if (lower.includes('warn')) return 'warning';
  if (lower.includes('info')) return 'info';
  return 'debug';
}
