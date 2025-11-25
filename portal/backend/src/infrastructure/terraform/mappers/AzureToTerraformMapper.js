/**
 * Maps Azure resource types to Terraform resource types
 */

/**
 * Map Azure resource type to Terraform resource type
 * @param {string} azureType - Azure resource type (e.g., "Microsoft.Storage/storageAccounts")
 * @returns {string|null} Terraform resource type or null if not supported
 */
export function mapAzureTypeToTerraform(azureType) {
  // Normalize to lowercase for case-insensitive comparison
  const normalizedType = azureType.toLowerCase();

  const typeMap = {
    // Storage
    "microsoft.storage/storageaccounts": "azurerm_storage_account",
    "microsoft.storage/storageaccounts/blobservices": "azurerm_storage_blob",
    "microsoft.storage/storageaccounts/fileservices": "azurerm_storage_share",
    "microsoft.storage/storageaccounts/queueservices": "azurerm_storage_queue",
    "microsoft.storage/storageaccounts/tableservices": "azurerm_storage_table",

    // Compute
    "microsoft.compute/virtualmachines": "azurerm_virtual_machine",
    "microsoft.compute/disks": "azurerm_managed_disk",
    "microsoft.compute/snapshots": "azurerm_snapshot",
    "microsoft.compute/virtualmachinescalesets": "azurerm_virtual_machine_scale_set",

    // Container
    "microsoft.containerinstance/containergroups": "azurerm_container_group",
    "microsoft.containerregistry/registries": "azurerm_container_registry",
    "microsoft.app/containerapps": "azurerm_container_app",
    "microsoft.app/managedenvironments": "azurerm_container_app_environment",

    // Networking
    "microsoft.network/virtualnetworks": "azurerm_virtual_network",
    "microsoft.network/networkinterfaces": "azurerm_network_interface",
    "microsoft.network/publicipaddresses": "azurerm_public_ip",
    "microsoft.network/loadbalancers": "azurerm_lb",
    "microsoft.network/networksecuritygroups": "azurerm_network_security_group",
    "microsoft.network/applicationgateways": "azurerm_application_gateway",
    "microsoft.network/frontdoors": "azurerm_frontdoor",
    "microsoft.cdn/profiles": "azurerm_cdn_profile",
    "microsoft.cdn/profiles/endpoints": "azurerm_cdn_endpoint",

    // Database
    "microsoft.sql/servers": "azurerm_mssql_server",
    "microsoft.sql/servers/databases": "azurerm_mssql_database",
    "microsoft.dbforpostgresql/flexibleservers": "azurerm_postgresql_flexible_server",
    "microsoft.dbforpostgresql/flexibleservers/databases": "azurerm_postgresql_flexible_server_database",
    "microsoft.dbformysql/flexibleservers": "azurerm_mysql_flexible_server",
    "microsoft.documentdb/databaseaccounts": "azurerm_cosmosdb_account",

    // Key Vault
    "microsoft.keyvault/vaults": "azurerm_key_vault",
    "microsoft.keyvault/vaults/secrets": "azurerm_key_vault_secret",
    "microsoft.keyvault/vaults/keys": "azurerm_key_vault_key",
    "microsoft.keyvault/vaults/certificates": "azurerm_key_vault_certificate",

    // Web
    "microsoft.web/serverfarms": "azurerm_app_service_plan",
    "microsoft.web/sites": "azurerm_app_service",
    "microsoft.web/staticsites": "azurerm_static_site",

    // Resource Group (both possible formats from Azure Resource Graph)
    "microsoft.resources/resourcegroups": "azurerm_resource_group",
    "microsoft.resources/subscriptions/resourcegroups": "azurerm_resource_group",

    // Monitoring
    "microsoft.insights/components": "azurerm_application_insights",
    "microsoft.operationalinsights/workspaces": "azurerm_log_analytics_workspace",

    // Identity
    "microsoft.managedidentity/userassignedidentities": "azurerm_user_assigned_identity"
  };

  return typeMap[normalizedType] || null;
}

/**
 * Get all supported Azure resource types
 * @returns {Array<string>} List of supported types
 */
export function getSupportedAzureTypes() {
  return Object.keys({
    "microsoft.storage/storageaccounts": true,
    "microsoft.compute/virtualmachines": true,
    "microsoft.containerinstance/containergroups": true,
    "microsoft.containerregistry/registries": true,
    "microsoft.app/containerapps": true,
    "microsoft.app/managedenvironments": true,
    "microsoft.network/virtualnetworks": true,
    "microsoft.network/networkinterfaces": true,
    "microsoft.network/publicipaddresses": true,
    "microsoft.network/loadbalancers": true,
    "microsoft.network/networksecuritygroups": true,
    "microsoft.network/applicationgateways": true,
    "microsoft.cdn/profiles": true,
    "microsoft.sql/servers": true,
    "microsoft.dbforpostgresql/flexibleservers": true,
    "microsoft.dbformysql/flexibleservers": true,
    "microsoft.documentdb/databaseaccounts": true,
    "microsoft.keyvault/vaults": true,
    "microsoft.web/serverfarms": true,
    "microsoft.web/sites": true,
    "microsoft.web/staticsites": true,
    "microsoft.resources/resourcegroups": true,
    "microsoft.resources/subscriptions/resourcegroups": true,
    "microsoft.insights/components": true,
    "microsoft.operationalinsights/workspaces": true,
    "microsoft.managedidentity/userassignedidentities": true
  });
}
