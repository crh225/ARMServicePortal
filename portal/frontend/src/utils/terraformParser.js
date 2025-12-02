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
 * Parse variables from Crossplane YAML claim
 * Extracts spec.parameters into flat form values using underscore notation
 * e.g. frontend.imageRepo -> frontend_imageRepo
 *
 * @param {string} yamlContent - Crossplane claim YAML
 * @returns {Object} - Parsed variables as key-value pairs
 */
export function parseCrossplaneVariables(yamlContent) {
  if (!yamlContent) return {};

  const variables = {};

  // Extract the parameters section from YAML
  // Look for parameters: and capture until we hit a line at the same or lower indent level
  const parametersMatch = yamlContent.match(/parameters:\s*\n([\s\S]*?)(?=\n\s{2}\w+:|$)/);
  if (!parametersMatch) return {};

  const parametersBlock = parametersMatch[1];

  // Track the current nesting level within parameters
  const currentPath = [];
  // The base indent level within parameters (typically 4 spaces)
  let baseIndent = null;

  const lines = parametersBlock.split('\n');
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Calculate indent level
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    // Set base indent from first non-empty line
    if (baseIndent === null) {
      baseIndent = indent;
    }

    // Stop if we've reached a line at or before the base parameters level
    // (e.g. writeConnectionSecretToRef at same level as parameters)
    if (indent < baseIndent) break;

    // Check if this is a key-value pair or a section header
    const kvMatch = line.match(/^(\s*)(\w+):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, spaces, key, rawValue] = kvMatch;
    const value = rawValue.replace(/^["']|["']$/g, '').trim();

    // Calculate relative level (0 = direct child of parameters, 1 = nested, etc.)
    const relativeIndent = indent - baseIndent;
    const level = Math.floor(relativeIndent / 2);

    // Pop path levels if we've gone back up
    while (currentPath.length > level) {
      currentPath.pop();
    }

    if (value) {
      // This is a leaf value - create the flat key
      const flatKey = currentPath.length > 0
        ? `${currentPath.join('_')}_${key}`
        : key;
      variables[flatKey] = value;
    } else {
      // This is a section header - push to path
      currentPath.push(key);
    }
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
