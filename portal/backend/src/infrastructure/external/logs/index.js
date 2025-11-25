/**
 * Azure Resource Logs Service
 * Main entry point for fetching logs from various Azure resources
 */
import { parseResourceId, getResourceCategory } from './parseResourceId.js';
import { getContainerAppLogs } from './containerAppLogs.js';
import { getContainerInstanceLogs } from './containerInstanceLogs.js';
import { getStorageAccountLogs } from './storageAccountLogs.js';
import { getKeyVaultLogs } from './keyVaultLogs.js';

/**
 * Get logs for any supported Azure resource
 * @param {string} resourceId - Full Azure resource ID
 * @param {Object} options - Options
 * @param {number} options.tail - Number of log lines to return (default: 100)
 * @param {string} options.timeRange - Time range for logs (default: '1h')
 * @returns {Promise<Object>} Logs data with metadata
 */
export async function getResourceLogs(resourceId, options = {}) {
  const { tail = 100, timeRange = '1h' } = options;

  // Parse the resource ID
  const parsed = parseResourceId(resourceId);
  if (!parsed || !parsed.resourceType) {
    throw new Error('Invalid resource ID');
  }

  // Determine resource category
  const category = getResourceCategory(parsed.resourceType);

  try {
    let logs = [];

    switch (category) {
      case 'container-app':
        logs = await getContainerAppLogs({
          resourceName: parsed.resourceName,
          tail,
          timeRange
        });
        break;

      case 'container-instance':
        logs = await getContainerInstanceLogs({
          subscriptionId: parsed.subscriptionId,
          resourceGroup: parsed.resourceGroup,
          resourceName: parsed.resourceName,
          tail
        });
        break;

      case 'storage':
        logs = await getStorageAccountLogs({
          resourceName: parsed.resourceName,
          tail,
          timeRange
        });
        break;

      case 'keyvault':
        logs = await getKeyVaultLogs({
          resourceName: parsed.resourceName,
          tail,
          timeRange
        });
        break;

      case 'unknown':
      default:
        return {
          resourceId,
          resourceType: parsed.resourceType,
          category,
          supported: false,
          message: `Logs not yet supported for resource type: ${parsed.resourceType}`,
          logs: []
        };
    }

    return {
      resourceId,
      resourceType: parsed.resourceType,
      resourceName: parsed.resourceName,
      category,
      supported: true,
      count: logs.length,
      logs
    };

  } catch (error) {
    console.error(`Failed to fetch logs for ${resourceId}:`, error.message);
    throw error;
  }
}
