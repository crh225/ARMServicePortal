/**
 * Terraform module parsing utilities
 */

/**
 * Parse variables from Terraform module code
 * Matches patterns like: variable_name = "value" or variable_name = value
 *
 * @param {string} terraformModule - Terraform module code
 * @returns {Object} - Parsed variables as key-value pairs
 */
export function parseTerraformVariables(terraformModule) {
  if (!terraformModule) return {};

  const variables = {};
  const regex = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*([^\s\n]+)/g;
  let match;

  while ((match = regex.exec(terraformModule)) !== null) {
    const key = match[1] || match[3];
    // Use nullish coalescing to preserve empty strings
    const value = match[2] !== undefined ? match[2] : match[4];
    variables[key] = value;
  }

  return variables;
}

/**
 * Initialize form values from blueprint variables
 *
 * @param {Object} blueprint - Blueprint object with variables
 * @returns {Object} - Initial form values with defaults
 */
export function initializeFormValues(blueprint) {
  if (!blueprint || !blueprint.variables) {
    return {};
  }

  const initial = {};
  blueprint.variables.forEach((v) => {
    // Use nullish coalescing to preserve 0, false, and empty string defaults
    initial[v.name] = v.default !== undefined ? v.default : "";
  });

  return initial;
}

/**
 * Parse policy errors from error message
 * Attempts to parse JSON error messages containing policy errors
 *
 * @param {string} errorMessage - Error message to parse
 * @returns {Object|null} - Parsed policy errors or null
 */
export function parsePolicyErrors(errorMessage) {
  if (!errorMessage) return null;

  try {
    const errorData = JSON.parse(errorMessage);
    return errorData.policyErrors || null;
  } catch {
    return null;
  }
}
