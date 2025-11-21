/**
 * Parse Azure Resource ID into its components
 * @param {string} resourceId - Full Azure resource ID
 * @returns {Object} Parsed components
 */
export function parseResourceId(resourceId) {
  if (!resourceId || typeof resourceId !== 'string') {
    return null;
  }

  const parts = resourceId.toLowerCase().split('/').filter(Boolean);
  const parsed = {};

  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      parsed[parts[i]] = parts[i + 1];
    }
  }

  // Extract common components
  const subscriptionMatch = resourceId.match(/\/subscriptions\/([^\/]+)\//i);
  const rgMatch = resourceId.match(/\/resourceGroups\/([^\/]+)\//i);
  const providerMatch = resourceId.match(/\/providers\/([^\/]+)\//i);
  const typeMatch = resourceId.match(/\/providers\/[^\/]+\/([^\/]+)\/([^\/]+)$/i);

  return {
    subscriptionId: subscriptionMatch ? subscriptionMatch[1] : null,
    resourceGroup: rgMatch ? rgMatch[1] : null,
    provider: providerMatch ? providerMatch[1] : null,
    resourceType: typeMatch ? `${providerMatch[1]}/${typeMatch[1]}` : null,
    resourceName: typeMatch ? typeMatch[2] : null,
    fullId: resourceId,
    ...parsed
  };
}

/**
 * Determine resource type category for log fetching
 * @param {string} resourceType - Azure resource type (e.g., "Microsoft.App/containerApps")
 * @returns {string} Category: 'container-app', 'container-instance', 'storage', 'unknown'
 */
export function getResourceCategory(resourceType) {
  if (!resourceType) return 'unknown';

  const type = resourceType.toLowerCase();

  if (type.includes('microsoft.app/containerapps')) {
    return 'container-app';
  }
  if (type.includes('microsoft.containerinstance')) {
    return 'container-instance';
  }
  if (type.includes('microsoft.storage/storageaccounts')) {
    return 'storage';
  }
  if (type.includes('microsoft.keyvault/vaults')) {
    return 'keyvault';
  }

  return 'unknown';
}
