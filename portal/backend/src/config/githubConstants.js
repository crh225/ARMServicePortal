/**
 * GitHub-related constants
 * Centralized configuration for PR labels, branch prefixes, etc.
 */

// PR label names by environment
export const PR_LABELS = {
  dev: {
    planOk: "status:plan-ok",
    planFailed: "status:plan-failed",
    applyOk: "status:apply-ok",
    applyFailed: "status:apply-failed",
    environment: "environment:dev"
  },
  qa: {
    planOk: "status:plan-ok-qa",
    planFailed: "status:plan-failed-qa",
    applyOk: "status:apply-ok-qa",
    applyFailed: "status:apply-failed-qa",
    environment: "environment:qa"
  },
  staging: {
    planOk: "status:plan-ok-staging",
    planFailed: "status:plan-failed-staging",
    applyOk: "status:apply-ok-staging",
    applyFailed: "status:apply-failed-staging",
    environment: "environment:staging"
  },
  prod: {
    planOk: "status:plan-ok-prod",
    planFailed: "status:plan-failed-prod",
    applyOk: "status:apply-ok-prod",
    applyFailed: "status:apply-failed-prod",
    environment: "environment:prod"
  }
};

// Branch name prefixes
export const BRANCH_PREFIXES = {
  provision: "requests",
  destroy: "destroy",
  promote: "requests"
};

// Default base branch
export const DEFAULT_BASE_BRANCH = "main";
