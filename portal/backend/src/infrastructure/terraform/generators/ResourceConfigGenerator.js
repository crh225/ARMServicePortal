/**
 * Generates Terraform resource configuration blocks from Azure resources
 */

import { generateTerraformResourceName } from "../utils/TerraformNaming.js";
import { redactSensitiveProperties } from "../utils/SensitiveDataRedactor.js";
import { generateResourceSpecificConfig } from "../utils/ResourceSpecificConfig.js";

/**
 * Generate basic Terraform resource configuration from Azure resource properties
 * @param {string} tfResourceType - Terraform resource type
 * @param {object} resource - Azure resource from Resource Graph
 * @returns {string} Terraform resource configuration
 */
export function generateResourceConfiguration(tfResourceType, resource) {
  // Generate raw resource configuration (no blueprint templates)
  // Blueprint module generation is now handled at a higher level in generateTerraformCode()
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
