/**
 * Maps Azure resource properties to blueprint module variables
 */

/**
 * Map Azure resource properties to blueprint variables
 * @param {object} resource - Azure resource
 * @param {Array} variables - Blueprint variables
 * @returns {object} Mapped variable values
 */
export function mapResourceToModuleVariables(resource, variables) {
  const values = {};

  // Map common variables
  if (variables.find(v => v.name === 'project_name')) {
    values.project_name = resource.name;
  }

  if (variables.find(v => v.name === 'environment')) {
    // Try to detect environment from tags or resource group name
    values.environment = resource.tags?.['armportal-environment'] || 'dev';
  }

  if (variables.find(v => v.name === 'resource_group_name')) {
    values.resource_group_name = resource.resourceGroup;
  }

  if (variables.find(v => v.name === 'location')) {
    values.location = resource.location;
  }

  // Add resource-specific variable mapping based on properties
  if (resource.properties) {
    // Storage Account specific
    if (resource.properties.accountType || resource.properties.sku) {
      const sku = resource.properties.sku || {};
      if (variables.find(v => v.name === 'account_tier')) {
        values.account_tier = sku.tier || 'Standard';
      }
      if (variables.find(v => v.name === 'replication_type')) {
        values.replication_type = sku.name?.replace(/^(Standard|Premium)_/, '') || 'LRS';
      }
    }

    // Key Vault specific
    if (resource.properties.sku?.name && variables.find(v => v.name === 'sku_name')) {
      values.sku_name = resource.properties.sku.name;
    }
    if (resource.properties.softDeleteRetentionInDays && variables.find(v => v.name === 'soft_delete_retention_days')) {
      values.soft_delete_retention_days = resource.properties.softDeleteRetentionInDays;
    }
    if (resource.properties.enablePurgeProtection !== undefined && variables.find(v => v.name === 'purge_protection_enabled')) {
      values.purge_protection_enabled = resource.properties.enablePurgeProtection;
    }
  }

  return values;
}
