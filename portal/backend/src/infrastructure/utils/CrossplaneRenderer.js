/**
 * CrossplaneRenderer - Renders Crossplane Claim YAML from blueprint config and variables
 *
 * Supports two modes:
 * 1. Single claim mode - Generates one claim from blueprint
 * 2. Building blocks mode - Generates multiple claims based on enabled components
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
 * Check if a blueprint uses building blocks mode
 * @param {Object} blueprint - Blueprint configuration
 * @returns {boolean}
 */
export function isBuildingBlocks(blueprint) {
  return isCrossplane(blueprint) && blueprint.crossplane.mode === "building-blocks";
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
        // Serialize item with no base indent, we'll handle indentation manually
        const itemYaml = toYaml(item, 0);
        const itemLines = itemYaml.split("\n");
        // First line gets the "- " prefix
        lines.push(`${spaces}- ${itemLines[0]}`);
        // Remaining lines get indented to align with first line content (2 extra spaces for "- ")
        for (let i = 1; i < itemLines.length; i++) {
          lines.push(`${spaces}  ${itemLines[i]}`);
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

/**
 * Building block claim configurations
 * Maps component names to their Crossplane claim types and parameter mappings
 */
const BUILDING_BLOCKS = {
  postgres: {
    kind: "PostgresClaim",
    suffix: "-db",
    parameterMapping: {
      storageGB: "postgres_storageGB",
      version: "postgres_version"
    }
  },
  redis: {
    kind: "RedisClaim",
    suffix: "-cache",
    parameterMapping: {
      version: "redis_version",
      memoryLimitMB: "redis_memoryLimitMB",
      storageGB: "redis_storageGB"
    }
  },
  rabbitmq: {
    kind: "RabbitMQClaim",
    suffix: "-mq",
    parameterMapping: {
      version: "rabbitmq_version",
      memoryLimitMB: "rabbitmq_memoryLimitMB",
      storageGB: "rabbitmq_storageGB",
      exposeManagement: "rabbitmq_exposeManagement",
      managementHost: "rabbitmq_managementHost"
    }
  },
  backend: {
    kind: "BackendClaim",
    suffix: "-backend",
    parameterMapping: {
      image: "backend_image",
      replicas: "backend_replicas",
      port: "backend_port",
      env: "environment",
      dbSecretName: (vars, appName) => vars.postgres_enabled ? `${appName}-db-credentials` : undefined
    }
  },
  frontend: {
    kind: "FrontendClaim",
    suffix: "-frontend",
    parameterMapping: {
      image: "frontend_image",
      replicas: "frontend_replicas",
      port: "frontend_port",
      backendUrl: (vars, appName) => vars.backend_enabled ? `http://${appName}-backend` : undefined
    }
  },
  ingress: {
    kind: "IngressClaim",
    suffix: "-ingress",
    parameterMapping: {
      host: "ingress_host",
      clusterIssuer: () => "letsencrypt-prod",
      paths: (vars, appName) => {
        const paths = [];
        if (vars.frontend_enabled) {
          paths.push({ path: "/", serviceName: `${appName}-frontend`, servicePort: 80 });
        }
        if (vars.backend_enabled) {
          paths.push({ path: "/api", serviceName: `${appName}-backend`, servicePort: 80 });
        }
        return paths.length > 0 ? paths : [{ path: "/", serviceName: `${appName}-backend`, servicePort: 80 }];
      }
    }
  }
};

/**
 * Extract parameters for a specific building block from form variables
 *
 * @param {string} blockName - Name of the building block (postgres, redis, etc.)
 * @param {Object} variables - Form variables
 * @param {string} appName - Application name for cross-references
 * @returns {Object} - Parameters for the claim
 */
function extractBlockParameters(blockName, variables, appName) {
  const block = BUILDING_BLOCKS[blockName];
  if (!block) return {};

  const parameters = {};

  for (const [paramName, mapping] of Object.entries(block.parameterMapping)) {
    let value;

    if (typeof mapping === "function") {
      value = mapping(variables, appName);
    } else {
      value = variables[mapping];
    }

    if (value !== undefined && value !== null && value !== "") {
      parameters[paramName] = coerceValue(value, paramName);
    }
  }

  return parameters;
}

/**
 * Create a single claim object for a building block
 *
 * @param {Object} options
 * @param {string} options.blockName - Building block name
 * @param {string} options.appName - Application name
 * @param {string} options.namespace - Target namespace
 * @param {Object} options.parameters - Claim parameters
 * @param {string} options.apiVersion - API version
 * @param {Object} options.labels - Common labels
 * @returns {Object} - Claim object
 */
function createClaimObject({ blockName, appName, namespace, parameters, apiVersion, labels }) {
  const block = BUILDING_BLOCKS[blockName];
  const claimName = `${appName}${block.suffix}`;

  return {
    apiVersion,
    kind: block.kind,
    metadata: {
      name: claimName,
      namespace,
      labels: {
        ...labels,
        "armportal.chrishouse.io/component": blockName
      }
    },
    spec: {
      parameters
    }
  };
}

/**
 * Render building blocks claims from blueprint and variables
 * Generates a multi-document YAML with namespace and all enabled component claims
 *
 * @param {Object} options
 * @param {Object} options.blueprint - Blueprint configuration
 * @param {Object} options.variables - Form variables (flat structure)
 * @param {string} options.prNumber - PR number for tracking labels
 * @param {string} options.createdBy - GitHub username of requester
 * @returns {string} - Multi-document YAML content
 */
export function renderBuildingBlocksClaims({ blueprint, variables, prNumber, createdBy }) {
  const { crossplane } = blueprint;
  const appName = variables.appName;
  const environment = variables.environment || "dev";
  const namespace = `${appName}-${environment}`;

  const documents = [];

  // Common labels for all resources
  const commonLabels = {
    "app.kubernetes.io/managed-by": "armportal",
    "app.kubernetes.io/name": appName,
    "app.kubernetes.io/instance": `${appName}-${environment}`,
    "armportal.chrishouse.io/blueprint": blueprint.id,
    "armportal.chrishouse.io/version": blueprint.version,
    "armportal.chrishouse.io/request-id": String(prNumber),
    ...(createdBy && { "armportal.chrishouse.io/created-by": createdBy })
  };

  // 1. Create namespace
  const namespaceDoc = {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      name: namespace,
      labels: {
        ...commonLabels,
        "app.kubernetes.io/managed-by": "crossplane",
        "istio-injection": "enabled"
      }
    }
  };
  documents.push(toYaml(namespaceDoc));

  // 2. Generate claims for each enabled component
  const components = ["postgres", "redis", "rabbitmq", "backend", "frontend", "ingress"];

  for (const component of components) {
    const enabledKey = `${component}_enabled`;

    if (variables[enabledKey] === true || variables[enabledKey] === "true") {
      const parameters = extractBlockParameters(component, variables, appName);

      const claim = createClaimObject({
        blockName: component,
        appName,
        namespace,
        parameters,
        apiVersion: crossplane.apiVersion,
        labels: commonLabels
      });

      documents.push(toYaml(claim));
    }
  }

  // Join with YAML document separator
  return "---\n" + documents.join("\n---\n");
}

/**
 * Main render function - dispatches to appropriate renderer based on blueprint mode
 *
 * @param {Object} options
 * @param {Object} options.blueprint - Blueprint configuration
 * @param {Object} options.variables - Form variables
 * @param {string} options.prNumber - PR number
 * @param {string} options.createdBy - Creator username
 * @param {string} [options.claimName] - Claim name (for single-claim mode)
 * @returns {string} - YAML content
 */
export function renderCrossplaneYaml({ blueprint, variables, prNumber, createdBy, claimName }) {
  if (isBuildingBlocks(blueprint)) {
    return renderBuildingBlocksClaims({ blueprint, variables, prNumber, createdBy });
  }

  // Single-claim mode
  return renderCrossplaneClaim({ claimName, blueprint, variables, prNumber, createdBy });
}
