/**
 * Terraform Code Generator
 * Main orchestrator for generating Terraform import blocks and resource definitions from Azure resources
 */

import { mapAzureTypeToTerraform, getSupportedAzureTypes } from "./mappers/AzureToTerraformMapper.js";
import { mapAzureTypeToBlueprint } from "./mappers/AzureToBlueprintMapper.js";
import { generateTerraformResourceName } from "./utils/TerraformNaming.js";
import { generateImportBlock, generateModuleImportBlock } from "./generators/ImportBlockGenerator.js";
import { generateResourceConfiguration } from "./generators/ResourceConfigGenerator.js";
import { generateFromBlueprintTemplate } from "./generators/ModuleConfigGenerator.js";

/**
 * Main function - Generate Terraform import blocks and configuration from Azure resource
 * @param {object} resource - Azure resource from Resource Graph
 * @param {boolean} useModules - If true, use blueprint modules; if false, generate raw resources
 * @returns {object} Generated Terraform code and metadata
 */
export function generateTerraformCode(resource, useModules = true) {
  const tfResourceType = mapAzureTypeToTerraform(resource.type);

  if (!tfResourceType) {
    return {
      success: false,
      error: `Unsupported Azure resource type: ${resource.type}`,
      supportedTypes: getSupportedAzureTypes().sort()
    };
  }

  const resourceName = generateTerraformResourceName(resource.name);
  const blueprintId = mapAzureTypeToBlueprint(resource.type);

  console.log(`[TerraformCodeGenerator] useModules: ${useModules}, blueprintId: ${blueprintId}, condition result: ${useModules && blueprintId}`);

  let importBlock;
  let resourceConfig;
  let notes;

  // Check if we should use blueprint modules AND we have a blueprint for this resource type
  if (useModules && blueprintId) {
    console.log(`[TerraformCodeGenerator] Entering module generation branch`);

    const moduleName = `${blueprintId}_${resourceName}`;

    // Try to generate from blueprint template
    resourceConfig = generateFromBlueprintTemplate(blueprintId, resource, tfResourceType);

    // If template generation failed (template not found), fall back to raw resource
    if (!resourceConfig) {
      console.log(`[TerraformCodeGenerator] Blueprint template not found for "${blueprintId}", falling back to raw resource`);
      importBlock = generateImportBlock(tfResourceType, resourceName, resource.id);
      resourceConfig = generateResourceConfiguration(tfResourceType, resource);

      notes = [
        "Review the generated configuration carefully before applying",
        "Search for ****_UPDATE_**** placeholders and replace with actual values (passwords, keys, secrets, etc.)",
        "Additional properties may be required based on your resource configuration",
        "Run 'terraform import' first, then 'terraform plan' to validate the configuration"
      ];
    } else {
      // Module generation succeeded
      importBlock = generateModuleImportBlock(moduleName, tfResourceType, "this", resource.id);

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
    }
  } else {
    console.log(`[TerraformCodeGenerator] Entering raw resource generation branch (useModules=${useModules}, blueprintId=${blueprintId})`);
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
  return getSupportedAzureTypes().sort();
}
