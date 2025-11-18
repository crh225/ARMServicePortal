/**
 * Environment-specific configuration
 * Centralized configuration for environment warnings and requirements
 */

export const ENVIRONMENT_CONFIG = {
  qa: {
    level: "warning",
    title: "QA Environment",
    message: "This deployment requires 1 approval before merging to main."
  },
  staging: {
    level: "warning",
    title: "Staging Environment",
    message: "This deployment requires 1 approval and should match QA tested configuration."
  },
  prod: {
    level: "critical",
    title: "Production Environment",
    message: "This deployment requires 2 approvals and change control documentation."
  }
};

/**
 * Get environment configuration for a given environment
 * @param {string} env - Environment name (qa, staging, prod)
 * @returns {Object|null} - Environment config or null if not found
 */
export function getEnvironmentConfig(env) {
  return ENVIRONMENT_CONFIG[env] || null;
}
