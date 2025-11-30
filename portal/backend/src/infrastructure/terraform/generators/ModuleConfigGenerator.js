/**
 * Generates Terraform module configuration blocks using blueprint templates
 */

import { loadBlueprintTemplate, extractBlueprintVariables } from "../blueprints/BlueprintTemplateLoader.js";
import { mapResourceToModuleVariables } from "../blueprints/BlueprintVariableMapper.js";
import { generateTerraformResourceName } from "../utils/TerraformNaming.js";

/**
 * Generate Terraform code using blueprint template as a module call
 * @param {string} blueprintId - Blueprint ID
 * @param {object} resource - Azure resource
 * @param {string} tfResourceType - Terraform resource type
 * @returns {string|null} Generated Terraform configuration or null if template not found
 */
export function generateFromBlueprintTemplate(blueprintId, resource, tfResourceType) {
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
    // Handle boolean strings ("true"/"false") as actual booleans
    if (value === 'true' || value === 'false') {
      config += `  ${key} = ${value}\n`;
    } else if (typeof value === 'string') {
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
