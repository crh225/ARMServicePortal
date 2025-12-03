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
 * Supports both single-document claims and multi-document building blocks
 * Extracts spec.parameters into flat form values using underscore notation
 * e.g. frontend.imageRepo -> frontend_imageRepo
 *
 * @param {string} yamlContent - Crossplane claim YAML (single or multi-document)
 * @returns {Object} - Parsed variables as key-value pairs
 */
export function parseCrossplaneVariables(yamlContent) {
  if (!yamlContent) return {};

  // Check if this is multi-document YAML (building blocks)
  const isMultiDocument = yamlContent.includes('\n---\n') || yamlContent.startsWith('---\n');

  if (isMultiDocument) {
    return parseBuildingBlocksVariables(yamlContent);
  }

  return parseSingleClaimVariables(yamlContent);
}

/**
 * Parse variables from a single Crossplane claim document
 */
function parseSingleClaimVariables(yamlContent) {
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
 * Parse variables from multi-document building blocks YAML
 * Extracts enabled components and their parameters from each claim
 */
function parseBuildingBlocksVariables(yamlContent) {
  const variables = {};

  // Split by document separator
  const documents = yamlContent.split(/\n---\n|^---\n/);

  // Map of claim kinds to component names and their variable prefixes
  const kindToComponent = {
    'PostgresClaim': 'postgres',
    'RedisClaim': 'redis',
    'RabbitMQClaim': 'rabbitmq',
    'BackendClaim': 'backend',
    'FrontendClaim': 'frontend',
    'IngressClaim': 'ingress'
  };

  // Map of parameter names to form field names for each component
  const parameterMappings = {
    postgres: {
      storageGB: 'postgres_storageGB',
      version: 'postgres_version'
    },
    redis: {
      version: 'redis_version',
      memoryLimitMB: 'redis_memoryLimitMB'
    },
    rabbitmq: {
      version: 'rabbitmq_version',
      memoryLimitMB: 'rabbitmq_memoryLimitMB',
      exposeManagement: 'rabbitmq_exposeManagement'
    },
    backend: {
      image: 'backend_image',
      replicas: 'backend_replicas',
      port: 'backend_port',
      connectToDb: 'backend_connectToDb'
    },
    frontend: {
      image: 'frontend_image',
      replicas: 'frontend_replicas'
    },
    ingress: {
      host: 'ingress_host',
      clusterIssuer: 'ingress_clusterIssuer'
    }
  };

  for (const doc of documents) {
    if (!doc.trim()) continue;

    // Extract kind
    const kindMatch = doc.match(/kind:\s*(\w+)/);
    if (!kindMatch) continue;

    const kind = kindMatch[1];

    // Handle Namespace - extract appName and environment
    if (kind === 'Namespace') {
      // Match quoted or unquoted namespace name
      const nameMatch = doc.match(/name:\s*["']?([a-z0-9-]+)["']?/);
      if (nameMatch) {
        // Namespace is named {appName}-{environment}
        const nsName = nameMatch[1];
        const parts = nsName.split('-');
        if (parts.length >= 2) {
          const env = parts.pop();
          const appName = parts.join('-');
          variables.appName = appName;
          variables.environment = env;
        }
      }
      continue;
    }

    // Handle claim types
    const component = kindToComponent[kind];
    if (!component) continue;

    // Mark component as enabled
    variables[`${component}_enabled`] = true;

    // Extract parameters from the claim
    const parametersMatch = doc.match(/parameters:\s*\n([\s\S]*?)(?=\n\s{2}\w+:|$)/);
    if (parametersMatch) {
      const parametersBlock = parametersMatch[1];
      const mapping = parameterMappings[component] || {};

      // Parse each parameter line
      const paramLines = parametersBlock.split('\n');
      for (const line of paramLines) {
        const paramMatch = line.match(/^\s{4}(\w+):\s*(.+)$/);
        if (paramMatch) {
          const [, paramName, rawValue] = paramMatch;
          const value = rawValue.replace(/^["']|["']$/g, '').trim();

          // Use mapping if available, otherwise create generic key
          const formKey = mapping[paramName] || `${component}_${paramName}`;
          variables[formKey] = value;
        }
      }
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
