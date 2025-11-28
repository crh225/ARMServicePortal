/**
 * CrossplaneRenderer - Renders Crossplane Claim YAML from blueprint config and variables
 *
 * Transforms flat form variables (e.g., "frontend_imageRepo") into nested YAML structure
 * required by Crossplane Claims.
 */

/**
 * Check if a blueprint is a Crossplane blueprint
 * @param {Object} blueprint - Blueprint configuration
 * @returns {boolean}
 */
export function isCrossplane(blueprint) {
  return blueprint.provider === "crossplane" && blueprint.crossplane;
}

/**
 * Transform flat variables to nested structure for Crossplane claim
 * e.g., { frontend_imageRepo: "x", frontend_tag: "y" } => { frontend: { imageRepo: "x", tag: "y" } }
 *
 * @param {Object} variables - Flat key-value pairs from form
 * @returns {Object} - Nested parameters object
 */
function transformVariablesToParameters(variables) {
  const parameters = {};

  for (const [key, value] of Object.entries(variables)) {
    if (key.includes("_")) {
      // Nested parameter (e.g., frontend_imageRepo -> frontend.imageRepo)
      const [parent, child] = key.split("_");
      if (!parameters[parent]) {
        parameters[parent] = {};
      }
      parameters[parent][child] = coerceValue(value, key);
    } else {
      // Top-level parameter
      parameters[key] = coerceValue(value, key);
    }
  }

  return parameters;
}

/**
 * Coerce string values to appropriate types
 * @param {string} value
 * @param {string} key
 * @returns {any}
 */
function coerceValue(value, key) {
  // Boolean coercion
  if (value === "true") return true;
  if (value === "false") return false;

  // Integer coercion for known numeric fields
  const numericFields = ["replicas", "port", "storageGB", "memoryLimitMB", "cpuLimit", "cpuRequest", "memoryRequest"];
  if (numericFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
    const num = parseInt(value, 10);
    if (!isNaN(num)) return num;
  }

  return value;
}

/**
 * Render a Crossplane Claim YAML from blueprint and variables
 *
 * @param {Object} options
 * @param {string} options.claimName - Name for the claim resource
 * @param {Object} options.blueprint - Blueprint configuration with crossplane config
 * @param {Object} options.variables - Form variables (flat structure)
 * @param {string} options.prNumber - PR number for tracking labels
 * @param {string} options.createdBy - GitHub username of requester
 * @returns {string} - YAML content
 */
export function renderCrossplaneClaim({ claimName, blueprint, variables, prNumber, createdBy }) {
  const { crossplane } = blueprint;
  const parameters = transformVariablesToParameters(variables);

  // Build the claim object
  const claim = {
    apiVersion: crossplane.apiVersion,
    kind: crossplane.kind,
    metadata: {
      name: claimName,
      namespace: crossplane.claimsNamespace || "platform-claims",
      labels: {
        "app.kubernetes.io/managed-by": "armportal",
        "armportal.chrishouse.io/blueprint": blueprint.id,
        "armportal.chrishouse.io/version": blueprint.version,
        "armportal.chrishouse.io/request-id": String(prNumber),
        ...(createdBy && { "armportal.chrishouse.io/created-by": createdBy })
      },
      annotations: {
        "armportal.chrishouse.io/provisioned-at": new Date().toISOString()
      }
    },
    spec: {
      parameters,
      writeConnectionSecretToRef: {
        name: `${claimName}-connection`
      }
    }
  };

  // If composition ref is specified, add it
  if (crossplane.compositionRef) {
    claim.spec.compositionRef = {
      name: crossplane.compositionRef
    };
  }

  return toYaml(claim);
}

/**
 * Convert JS object to YAML string
 * Simple YAML serializer - handles the structures we need
 *
 * @param {any} obj
 * @param {number} indent
 * @returns {string}
 */
function toYaml(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  const lines = [];

  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    // Quote strings that need it
    if (needsQuoting(obj)) {
      return `"${escapeYamlString(obj)}"`;
    }
    return obj;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        const itemYaml = toYaml(item, indent + 1);
        const firstLine = itemYaml.split("\n")[0];
        const restLines = itemYaml.split("\n").slice(1);
        lines.push(`${spaces}- ${firstLine.trim()}`);
        for (const line of restLines) {
          lines.push(`${spaces}  ${line}`);
        }
      } else {
        lines.push(`${spaces}- ${toYaml(item, 0)}`);
      }
    }
    return lines.join("\n");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    for (const [key, value] of entries) {
      if (value === undefined) continue;

      if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        lines.push(`${spaces}${key}:`);
        lines.push(toYaml(value, indent + 1));
      } else if (Array.isArray(value) && value.length > 0) {
        lines.push(`${spaces}${key}:`);
        lines.push(toYaml(value, indent + 1));
      } else if (Array.isArray(value) && value.length === 0) {
        lines.push(`${spaces}${key}: []`);
      } else if (typeof value === "object" && value !== null && Object.keys(value).length === 0) {
        lines.push(`${spaces}${key}: {}`);
      } else {
        lines.push(`${spaces}${key}: ${toYaml(value, 0)}`);
      }
    }
    return lines.join("\n");
  }

  return String(obj);
}

/**
 * Check if a string needs quoting in YAML
 */
function needsQuoting(str) {
  // Quote if starts with special chars, contains colons, or is a reserved word
  const reserved = ["true", "false", "null", "yes", "no", "on", "off"];
  if (reserved.includes(str.toLowerCase())) return true;
  // Quote numeric-looking strings to ensure they're parsed as strings (needed for K8s labels)
  if (/^[0-9.-]+$/.test(str)) return true;
  if (/[:{}\[\],&*#?|\-<>=!%@`]/.test(str)) return true;
  if (str.includes("\n")) return true;
  if (str.startsWith(" ") || str.endsWith(" ")) return true;
  return false;
}

/**
 * Escape special characters in YAML strings
 */
function escapeYamlString(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/**
 * Generate the file path for a Crossplane claim
 *
 * @param {string} environment - Target environment (dev, staging, prod)
 * @param {string} claimName - Name of the claim
 * @returns {string} - File path relative to repo root
 */
export function getCrossplaneFilePath(environment, claimName) {
  return `infra/crossplane/claims/${environment}/${claimName}.yaml`;
}
