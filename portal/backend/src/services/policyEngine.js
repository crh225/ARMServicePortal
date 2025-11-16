/**
 * Policy Engine - Validates and enforces resource policies
 */

/**
 * Policy configuration
 */
const POLICIES = {
  // Naming convention policies
  naming: {
    enabled: true,
    pattern: /^[a-z0-9-]+$/,
    maxLength: 63,
    message: "Resource names must be lowercase alphanumeric with hyphens only"
  },

  // Required tags
  requiredTags: {
    enabled: true,
    tags: ["owner", "cost_center", "environment"],
    message: "Missing required tags"
  },

  // Environment-specific policies
  environments: {
    dev: {
      requiresApproval: false,
      message: "Development environment - no approval required",
      allowedHours: "24/7"
    },
    qa: {
      requiresApproval: true,
      approvalCount: 1,
      message: "QA deployments require 1 approval",
      allowedHours: "business hours"
    },
    staging: {
      requiresApproval: true,
      approvalCount: 1,
      message: "Staging deployments require 1 approval and must match QA tested config",
      allowedHours: "business hours"
    },
    prod: {
      requiresApproval: true,
      approvalCount: 2,
      message: "Production deployments require 2 approvals",
      allowedHours: "business hours",
      requiresChangeControl: true
    }
  }
};

/**
 * Validate a provision request against policies
 * @param {Object} request - The provision request
 * @param {string} request.blueprintId - Blueprint ID
 * @param {string} request.environment - Target environment
 * @param {Object} request.variables - Terraform variables
 * @param {Object} request.blueprint - Blueprint definition with variables
 * @returns {Object} - Validation result with errors and warnings
 */
export function validatePolicies(request) {
  const errors = [];
  const warnings = [];
  const autoFilled = {};

  // Validate required fields from blueprint
  if (request.blueprint && request.blueprint.variables) {
    request.blueprint.variables.forEach(varDef => {
      if (varDef.required) {
        const value = request.variables[varDef.name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            field: varDef.name,
            message: `${varDef.label} is required`,
            policy: "required-field"
          });
        }
      }
    });
  }

  // Validate naming convention
  if (POLICIES.naming.enabled && request.variables.project_name) {
    const name = request.variables.project_name;

    if (!POLICIES.naming.pattern.test(name)) {
      errors.push({
        field: "project_name",
        message: POLICIES.naming.message,
        policy: "naming-convention"
      });
    }

    if (name.length > POLICIES.naming.maxLength) {
      errors.push({
        field: "project_name",
        message: `Resource name must be ${POLICIES.naming.maxLength} characters or less`,
        policy: "naming-length"
      });
    }
  }

  // Auto-fill environment tag
  if (!request.variables.environment && request.environment) {
    autoFilled.environment = request.environment;
  }

  // Check required tags
  if (POLICIES.requiredTags.enabled) {
    const missingTags = POLICIES.requiredTags.tags.filter(
      tag => !request.variables[tag] && !autoFilled[tag]
    );

    if (missingTags.length > 0) {
      warnings.push({
        message: `${POLICIES.requiredTags.message}: ${missingTags.join(", ")}`,
        missingTags,
        policy: "required-tags"
      });
    }
  }

  // Check environment-specific policies
  if (request.environment && POLICIES.environments[request.environment]) {
    const envPolicy = POLICIES.environments[request.environment];

    if (envPolicy.requiresApproval) {
      warnings.push({
        message: envPolicy.message,
        policy: "approval-required",
        severity: "high"
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    autoFilled
  };
}

/**
 * Apply auto-filled values to variables
 */
export function applyAutoFill(variables, autoFilled) {
  return {
    ...variables,
    ...autoFilled
  };
}

/**
 * Generate suggested resource name based on blueprint and environment
 */
export function generateResourceName(blueprintId, projectName, environment) {
  // Remove "azure-" prefix and "-basic" suffix for cleaner names
  const cleanBlueprintId = blueprintId
    .replace(/^azure-/, "")
    .replace(/-basic$/, "");

  // Sanitize project name
  const sanitizedProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .substring(0, 20);

  return `${sanitizedProject}-${cleanBlueprintId}-${environment}`;
}

/**
 * Validate Azure resource naming rules for specific resource types
 */
export function validateAzureNaming(resourceType, name) {
  const rules = {
    "resource-group": {
      minLength: 1,
      maxLength: 90,
      pattern: /^[\w\-\.()]+$/,
      message: "Resource group names can contain alphanumerics, underscores, parentheses, hyphens, periods"
    },
    "storage-account": {
      minLength: 3,
      maxLength: 24,
      pattern: /^[a-z0-9]+$/,
      message: "Storage account names must be lowercase alphanumeric only"
    },
    "key-vault": {
      minLength: 3,
      maxLength: 24,
      pattern: /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$/,
      message: "Key Vault names must start with a letter, end with letter or digit, and contain only alphanumerics and hyphens"
    }
  };

  const rule = rules[resourceType];
  if (!rule) return { valid: true };

  const errors = [];

  if (name.length < rule.minLength) {
    errors.push(`Name must be at least ${rule.minLength} characters`);
  }

  if (name.length > rule.maxLength) {
    errors.push(`Name must be ${rule.maxLength} characters or less`);
  }

  if (!rule.pattern.test(name)) {
    errors.push(rule.message);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
