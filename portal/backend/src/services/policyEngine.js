/**
 * Policy Engine - Validates and enforces resource policies
 */

import { POLICIES } from "../config/policyConfig.js";

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
  const rule = POLICIES.azureNaming[resourceType];
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

/**
 * Validate environment promotion eligibility
 * @param {Object} sourceJob - The source job/resource
 * @param {string} targetEnvironment - The target environment to promote to
 * @returns {Object} - Validation result
 */
export function validatePromotion(sourceJob, targetEnvironment) {
  const errors = [];
  const warnings = [];

  const sourceEnv = sourceJob.environment;

  // Check if source environment is valid
  if (!sourceEnv) {
    errors.push({
      field: "environment",
      message: "Source resource has no environment specified",
      policy: "promotion-validation"
    });
    return { valid: false, errors, warnings };
  }

  // Check if promotion path is valid using config
  const validTargets = POLICIES.promotionPaths[sourceEnv] || [];
  if (!validTargets.includes(targetEnvironment)) {
    errors.push({
      field: "environment",
      message: `Cannot promote from ${sourceEnv} to ${targetEnvironment}. Valid targets: ${validTargets.length > 0 ? validTargets.join(", ") : "none (final environment)"}`,
      policy: "promotion-path"
    });
  }

  // Check if source is deployed
  if (!sourceJob.merged) {
    errors.push({
      field: "status",
      message: "Source resource must be deployed (PR merged) before promotion",
      policy: "promotion-deployment-status"
    });
  }

  // Environment-specific warnings
  if (targetEnvironment === "staging") {
    warnings.push({
      message: "Staging promotion requires QA testing validation",
      policy: "staging-requirements",
      severity: "medium"
    });
  }

  if (targetEnvironment === "prod") {
    warnings.push({
      message: "Production promotion requires 2 approvals and change control documentation",
      policy: "production-requirements",
      severity: "high"
    });
    warnings.push({
      message: "Ensure staging validation is complete before promoting to production",
      policy: "production-staging-validation",
      severity: "high"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
