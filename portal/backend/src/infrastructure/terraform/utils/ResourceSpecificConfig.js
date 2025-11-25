/**
 * Resource-specific configuration utilities for different Azure resource types
 */

/**
 * Generate resource-specific configuration based on type
 * @param {string} tfResourceType - Terraform resource type
 * @param {object} properties - Azure resource properties
 * @returns {string} Resource-specific configuration
 */
export function generateResourceSpecificConfig(tfResourceType, properties) {
  let config = "";

  // Key Vault specific properties
  if (tfResourceType === "azurerm_key_vault" && properties) {
    if (properties.tenantId) {
      config += `  tenant_id                  = "${properties.tenantId}"\n`;
    }
    if (properties.sku?.name) {
      config += `  sku_name                   = "${properties.sku.name.toLowerCase()}"\n`;
    }
    if (properties.softDeleteRetentionInDays) {
      config += `  soft_delete_retention_days = ${properties.softDeleteRetentionInDays}\n`;
    }
    if (properties.enableRbacAuthorization !== undefined) {
      config += `  enable_rbac_authorization  = ${properties.enableRbacAuthorization}\n`;
    }
    if (properties.publicNetworkAccess) {
      const enabled = properties.publicNetworkAccess === "Enabled";
      config += `  public_network_access_enabled = ${enabled}\n`;
    }
  }

  // Storage Account specific properties
  if (tfResourceType === "azurerm_storage_account" && properties) {
    if (properties.sku?.name) {
      config += `  account_tier             = "${properties.sku.name.split("_")[0]}"\n`;
      config += `  account_replication_type = "${properties.sku.name.split("_")[1]}"\n`;
    }
    if (properties.accountKind) {
      config += `  account_kind             = "${properties.accountKind}"\n`;
    }
  }

  return config;
}
