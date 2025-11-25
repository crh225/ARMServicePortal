/**
 * Terraform Code Generator
 * Generates Terraform import blocks and resource definitions from Azure resources
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Map Azure resource types to blueprint module IDs
 * @param {string} azureType - Azure resource type
 * @returns {string|null} Blueprint ID or null if no blueprint exists
 */
function mapAzureTypeToBlueprint(azureType) {
  const normalizedType = azureType.toLowerCase();

  const blueprintMap = {
    "microsoft.storage/storageaccounts": "azure-storage-basic",
    "microsoft.keyvault/vaults": "azure-key-vault-basic",
    "microsoft.resources/resourcegroups": "azure-rg-basic",
    "microsoft.resources/subscriptions/resourcegroups": "azure-rg-basic",
    "microsoft.dbforpostgresql/flexibleservers": "azure-postgres-flexible",
    "microsoft.web/staticsites": "azure-static-site",
    "microsoft.containerinstance/containergroups": "azure-aci",
    "microsoft.cdn/profiles": "azure-frontdoor"
  };

  return blueprintMap[normalizedType] || null;
}

/**
 * Load blueprint template from module directory
 * @param {string} blueprintId - Blueprint ID
 * @returns {string|null} Template content or null if not found
 */
function loadBlueprintTemplate(blueprintId) {
  try {
    // Navigate from backend/src/infrastructure/utils to infra/modules
    const modulePath = path.join(__dirname, "..", "..", "..", "..", "..", "infra", "modules", blueprintId, "main.tf");

    if (fs.existsSync(modulePath)) {
      return fs.readFileSync(modulePath, "utf8");
    }
  } catch (error) {
    console.error(`Failed to load blueprint template for ${blueprintId}:`, error);
  }

  return null;
}

/**
 * Extract variable definitions from blueprint template
 * @param {string} template - Blueprint template content
 * @returns {Array} Array of variable definitions with name, type, and default
 */
function extractBlueprintVariables(template) {
  const variables = [];
  const variableRegex = /variable\s+"([^"]+)"\s*\{[^}]*type\s*=\s*([^\n]+)[^}]*(?:default\s*=\s*([^\n}]+))?[^}]*\}/g;

  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    const [, name, type, defaultValue] = match;
    variables.push({
      name: name.trim(),
      type: type.trim(),
      default: defaultValue ? defaultValue.trim() : null
    });
  }

  return variables;
}

/**
 * Map Azure resource properties to blueprint variables
 * @param {object} resource - Azure resource
 * @param {Array} variables - Blueprint variables
 * @returns {object} Mapped variable values
 */
function mapResourceToModuleVariables(resource, variables) {
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

/**
 * Generate Terraform code using blueprint template as a module call
 * @param {string} blueprintId - Blueprint ID
 * @param {object} resource - Azure resource
 * @param {string} tfResourceType - Terraform resource type
 * @returns {string} Generated Terraform configuration
 */
function generateFromBlueprintTemplate(blueprintId, resource, tfResourceType) {
  const template = loadBlueprintTemplate(blueprintId);
  const resourceName = generateTerraformResourceName(resource.name);

  if (!template) {
    return null;
  }

  // Extract variables from the blueprint template
  const variables = extractBlueprintVariables(template);

  // Map Azure resource properties to module variables
  const moduleVars = mapResourceToModuleVariables(resource, variables);

  // Generate module call
  let config = `# Import existing resource into Terraform management\n`;
  config += `# Generated using blueprint: ${blueprintId}\n\n`;
  config += `module "${blueprintId}_${resourceName}" {\n`;
  config += `  source = "../../modules/${blueprintId}"\n\n`;

  // Add mapped variables
  for (const [key, value] of Object.entries(moduleVars)) {
    if (typeof value === 'string') {
      config += `  ${key} = "${value}"\n`;
    } else if (typeof value === 'number') {
      config += `  ${key} = ${value}\n`;
    } else if (typeof value === 'boolean') {
      config += `  ${key} = ${value}\n`;
    }
  }

  // Add ARMPortal tags
  config += `\n  # ARM Portal tracking tags\n`;
  config += `  tags = {\n`;

  // Preserve existing armportal tags or create new ones
  const environment = resource.tags?.['armportal-environment'] || 'dev';
  const requestId = resource.tags?.['armportal-request-id'];
  const owner = resource.tags?.['armportal-owner'] || 'imported';

  config += `    armportal-environment = "${environment}"\n`;
  config += `    armportal-blueprint   = "${blueprintId}"\n`;
  if (requestId) {
    config += `    armportal-request-id  = "${requestId}"\n`;
  }
  config += `    armportal-owner       = "${owner}"\n`;

  // Add any other existing tags
  if (resource.tags) {
    for (const [key, value] of Object.entries(resource.tags)) {
      if (!key.startsWith('armportal-')) {
        config += `    ${key} = "${value}"\n`;
      }
    }
  }

  config += `  }\n`;
  config += `}\n`;

  return config;
}

/**
 * Map Azure resource type to Terraform resource type
 * @param {string} azureType - Azure resource type (e.g., "Microsoft.Storage/storageAccounts")
 * @returns {string|null} Terraform resource type or null if not supported
 */
function mapAzureTypeToTerraform(azureType) {
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
 * Generate a safe Terraform resource name from Azure resource name
 * @param {string} azureName - Azure resource name
 * @returns {string} Safe Terraform resource name
 */
function generateTerraformResourceName(azureName) {
  // Replace special characters with underscores and convert to lowercase
  return azureName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[0-9]/, "r_$&") // Prefix with r_ if starts with number
    .substring(0, 64); // Limit length
}

/**
 * List of sensitive property keys to redact
 */
const SENSITIVE_KEYS = [
  "password",
  "passwords",
  "secret",
  "secrets",
  "key",
  "keys",
  "connectionString",
  "connectionStrings",
  "accessKey",
  "accessKeys",
  "token",
  "tokens",
  "credential",
  "credentials",
  "privateKey",
  "certificatePassword",
  "adminPassword",
  "administratorLoginPassword"
];

/**
 * Check if a property key is sensitive
 * @param {string} key - Property key name
 * @returns {boolean} True if sensitive
 */
function isSensitiveKey(key) {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase()));
}

/**
 * Get placeholder for sensitive field
 * @param {string} key - Property key name
 * @returns {string} Placeholder value
 */
function getSensitivePlaceholder(key) {
  const lowerKey = key.toLowerCase();

  // Return context-specific placeholders
  if (lowerKey.includes("password")) {
    return "****_UPDATE_PASSWORD_****";
  } else if (lowerKey.includes("secret")) {
    return "****_UPDATE_SECRET_****";
  } else if (lowerKey.includes("key") || lowerKey.includes("accesskey")) {
    return "****_UPDATE_KEY_****";
  } else if (lowerKey.includes("connectionstring")) {
    return "****_UPDATE_CONNECTION_STRING_****";
  } else if (lowerKey.includes("token")) {
    return "****_UPDATE_TOKEN_****";
  } else if (lowerKey.includes("credential")) {
    return "****_UPDATE_CREDENTIAL_****";
  } else if (lowerKey.includes("certificate")) {
    return "****_UPDATE_CERTIFICATE_****";
  }

  return "****_UPDATE_SENSITIVE_VALUE_****";
}

/**
 * Redact sensitive values from properties object
 * @param {object} properties - Azure resource properties
 * @returns {object} Properties with sensitive values redacted
 */
function redactSensitiveProperties(properties) {
  if (!properties || typeof properties !== "object") {
    return properties;
  }

  const redacted = { ...properties };

  for (const [key, value] of Object.entries(redacted)) {
    if (isSensitiveKey(key)) {
      redacted[key] = getSensitivePlaceholder(key);
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveProperties(value);
    }
  }

  return redacted;
}

/**
 * Generate resource-specific configuration based on type
 * @param {string} tfResourceType - Terraform resource type
 * @param {object} properties - Azure resource properties
 * @returns {string} Resource-specific configuration
 */
function generateResourceSpecificConfig(tfResourceType, properties) {
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

/**
 * Generate basic Terraform resource configuration from Azure resource properties
 * @param {string} tfResourceType - Terraform resource type
 * @param {object} resource - Azure resource from Resource Graph
 * @returns {string} Terraform resource configuration
 */
function generateResourceConfiguration(tfResourceType, resource) {
  // Try to use blueprint template first
  const blueprintId = mapAzureTypeToBlueprint(resource.type);
  if (blueprintId) {
    const blueprintConfig = generateFromBlueprintTemplate(blueprintId, resource, tfResourceType);
    if (blueprintConfig) {
      return blueprintConfig;
    }
  }

  // Fall back to generic generation
  const resourceName = generateTerraformResourceName(resource.name);
  const properties = redactSensitiveProperties(resource.properties || {});

  // Generate basic configuration based on common patterns
  let config = `resource "${tfResourceType}" "${resourceName}" {\n`;
  config += `  name                = "${resource.name}"\n`;

  // Add location if present (but not for resource groups - they have location but it's the only required field)
  if (resource.location && tfResourceType !== "azurerm_resource_group") {
    config += `  location            = "${resource.location}"\n`;
  } else if (resource.location && tfResourceType === "azurerm_resource_group") {
    // For resource groups, location is required
    config += `  location            = "${resource.location}"\n`;
  }

  // Add resource group if present and not a resource group itself
  if (resource.resourceGroup && tfResourceType !== "azurerm_resource_group") {
    config += `  resource_group_name = "${resource.resourceGroup}"\n`;
  }

  // Add resource-specific configuration
  const resourceSpecific = generateResourceSpecificConfig(tfResourceType, resource.properties);
  if (resourceSpecific) {
    config += "\n" + resourceSpecific;
  }

  // Add tags
  if (resource.tags && Object.keys(resource.tags).length > 0) {
    config += `\n  tags = {\n`;
    for (const [key, value] of Object.entries(resource.tags)) {
      config += `    "${key}" = "${value}"\n`;
    }
    config += `  }\n`;
  }

  // Add note about additional properties
  config += `\n  # Additional properties may be required. Review Azure resource configuration:\n`;
  config += `  # Properties found: ${JSON.stringify(properties, null, 2).split("\n").join("\n  # ")}\n`;

  config += `}\n`;

  return config;
}

/**
 * Generate Terraform import block
 * @param {string} tfResourceType - Terraform resource type
 * @param {string} resourceName - Terraform resource name
 * @param {string} azureResourceId - Azure resource ID
 * @returns {string} Terraform import block
 */
function generateImportBlock(tfResourceType, resourceName, azureResourceId) {
  return `import {
  to = ${tfResourceType}.${resourceName}
  id = "${azureResourceId}"
}\n`;
}

/**
 * Generate import block for module-based resources
 * @param {string} moduleName - Module instance name
 * @param {string} tfResourceType - Terraform resource type
 * @param {string} resourceLabel - Resource label within module (usually "this")
 * @param {string} azureResourceId - Azure resource ID
 * @returns {string} Terraform import block for module resource
 */
function generateModuleImportBlock(moduleName, tfResourceType, resourceLabel, azureResourceId) {
  return `import {
  to = module.${moduleName}.${tfResourceType}.${resourceLabel}
  id = "${azureResourceId}"
}\n`;
}

/**
 * Generate complete Terraform code for an Azure resource
 * @param {object} resource - Azure resource from Resource Graph
 * @returns {object|null} Generated Terraform code or null if unsupported
 */
export function generateTerraformCode(resource) {
  const tfResourceType = mapAzureTypeToTerraform(resource.type);

  if (!tfResourceType) {
    return {
      success: false,
      error: `Unsupported Azure resource type: ${resource.type}`,
      supportedTypes: Object.keys(mapAzureTypeToTerraform).sort()
    };
  }

  const resourceName = generateTerraformResourceName(resource.name);
  const blueprintId = mapAzureTypeToBlueprint(resource.type);

  let importBlock;
  let resourceConfig;
  let notes;

  // Check if we have a blueprint for this resource type
  if (blueprintId) {
    const moduleName = `${blueprintId}_${resourceName}`;

    // For module-based imports, the import targets the resource inside the module
    // Most blueprints use "this" as the resource label
    importBlock = generateModuleImportBlock(moduleName, tfResourceType, "this", resource.id);
    resourceConfig = generateResourceConfiguration(tfResourceType, resource);

    notes = [
      `This resource uses the "${blueprintId}" blueprint module`,
      "The import block targets the resource within the module (usually labeled 'this')",
      "After placing this code in infra/environments/<env>/, run:",
      "",
      `1. terraform import 'module.${moduleName}.${tfResourceType}.this' '${resource.id}'`,
      "",
      "2. terraform plan - to verify the import matches the module configuration",
      "",
      "Review and adjust module variables to match your existing resource configuration",
      "The module may create additional resources (diagnostic settings, role assignments, etc.)"
    ];
  } else {
    // Fall back to direct resource import (no blueprint)
    importBlock = generateImportBlock(tfResourceType, resourceName, resource.id);
    resourceConfig = generateResourceConfiguration(tfResourceType, resource);

    notes = [
      "Review the generated configuration carefully before applying",
      "Search for ****_UPDATE_**** placeholders and replace with actual values (passwords, keys, secrets, etc.)",
      "Additional properties may be required based on your resource configuration",
      "Run 'terraform import' first, then 'terraform plan' to validate the configuration"
    ];
  }

  return {
    success: true,
    tfResourceType,
    resourceName,
    code: `${importBlock}\n${resourceConfig}`,
    importBlock,
    resourceConfig,
    blueprintId,
    notes
  };
}

/**
 * Check if resource type is supported for Terraform generation
 * @param {string} azureType - Azure resource type
 * @returns {boolean} True if supported
 */
export function isResourceTypeSupported(azureType) {
  return mapAzureTypeToTerraform(azureType) !== null;
}

/**
 * Get all supported Azure resource types
 * @returns {string[]} Array of supported Azure resource types
 */
export function getSupportedResourceTypes() {
  const typeMap = {
    "microsoft.storage/storageaccounts": "azurerm_storage_account",
    "microsoft.compute/virtualmachines": "azurerm_virtual_machine",
    "microsoft.network/virtualnetworks": "azurerm_virtual_network",
    "microsoft.sql/servers": "azurerm_mssql_server",
    "microsoft.keyvault/vaults": "azurerm_key_vault",
    "microsoft.web/sites": "azurerm_app_service",
    "microsoft.resources/resourcegroups": "azurerm_resource_group",
    "microsoft.resources/subscriptions/resourcegroups": "azurerm_resource_group"
  };

  return Object.keys(typeMap).sort();
}
