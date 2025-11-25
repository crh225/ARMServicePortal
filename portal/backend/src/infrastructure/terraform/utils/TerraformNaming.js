/**
 * Terraform naming utilities for generating valid Terraform identifiers
 */

/**
 * Generate a valid Terraform resource name from an Azure resource name
 * @param {string} azureName - Azure resource name
 * @returns {string} Valid Terraform resource name
 */
export function generateTerraformResourceName(azureName) {
  // Replace special characters with underscores and convert to lowercase
  return azureName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[0-9]/, "r_$&") // Prefix with r_ if starts with number
    .substring(0, 64); // Limit length
}
