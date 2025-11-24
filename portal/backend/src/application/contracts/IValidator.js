/**
 * Validator Interface
 * Used by ValidationBehavior to validate requests before handler execution
 */
export class IValidator {
  /**
   * Validate the request
   * @param {IRequest} request - The request to validate
   * @returns {ValidationResult} Validation result with errors if any
   */
  validate(request) {
    throw new Error("Method not implemented");
  }
}

/**
 * Validation Result
 */
export class ValidationResult {
  constructor() {
    this.errors = [];
  }

  get isValid() {
    return this.errors.length === 0;
  }

  addError(field, message) {
    this.errors.push({ field, message });
  }

  addErrors(errors) {
    this.errors.push(...errors);
  }
}
