/**
 * Policy configuration
 * Centralized configuration for resource provisioning policies
 */

export const POLICIES = {
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
  },

  // Azure resource naming rules
  azureNaming: {
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
  },

  // Valid promotion paths
  promotionPaths: {
    dev: ["qa"],
    qa: ["staging"],
    staging: ["prod"],
    prod: []
  }
};
