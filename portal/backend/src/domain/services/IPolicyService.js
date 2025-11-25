/**
 * Policy Service Interface
 * Defines contract for policy validation and enforcement
 */
export class IPolicyService {
  /**
   * Validate a provision request against policies
   * @param {Object} request - The provision request
   * @returns {Object} - Validation result with errors, warnings, and autoFilled values
   */
  validatePolicies(request) {
    throw new Error("validatePolicies() must be implemented");
  }

  /**
   * Apply auto-filled values to variables
   * @param {Object} variables - Original variables
   * @param {Object} autoFilled - Auto-filled values
   * @returns {Object} - Merged variables
   */
  applyAutoFill(variables, autoFilled) {
    throw new Error("applyAutoFill() must be implemented");
  }

  /**
   * Validate promotion eligibility
   * @param {Object} sourceJob - Source job/resource
   * @param {string} targetEnvironment - Target environment
   * @returns {Object} - Validation result
   */
  validatePromotion(sourceJob, targetEnvironment) {
    throw new Error("validatePromotion() must be implemented");
  }
}
