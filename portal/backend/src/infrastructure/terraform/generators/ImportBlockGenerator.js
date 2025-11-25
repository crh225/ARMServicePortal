/**
 * Generates Terraform import blocks for Azure resources
 */

/**
 * Generate Terraform import block for raw resource
 * @param {string} tfResourceType - Terraform resource type
 * @param {string} resourceName - Terraform resource name
 * @param {string} azureResourceId - Azure resource ID
 * @returns {string} Terraform import block
 */
export function generateImportBlock(tfResourceType, resourceName, azureResourceId) {
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
export function generateModuleImportBlock(moduleName, tfResourceType, resourceLabel, azureResourceId) {
  return `import {
  to = module.${moduleName}.${tfResourceType}.${resourceLabel}
  id = "${azureResourceId}"
}\n`;
}
