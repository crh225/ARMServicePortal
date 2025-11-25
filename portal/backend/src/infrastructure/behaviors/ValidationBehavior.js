/**
 * Validation Pipeline Behavior
 * Validates requests before they reach the handler
 * Throws ValidationException if validation fails
 */
import { IPipelineBehavior } from "../../application/contracts/IPipelineBehavior.js";

export class ValidationException extends Error {
  constructor(errors) {
    super("Validation failed");
    this.name = "ValidationException";
    this.status = 400;
    this.errors = errors;
  }
}

export class ValidationBehavior extends IPipelineBehavior {
  constructor(validators = {}) {
    super();
    this.validators = validators; // Map of RequestName -> Validator
  }

  async handle(request, next) {
    const requestName = request.constructor.name;
    const validator = this.validators[requestName];

    if (validator) {
      const validationResult = validator.validate(request);

      if (!validationResult.isValid) {
        throw new ValidationException(validationResult.errors);
      }
    }

    // If validation passes (or no validator), continue to next behavior/handler
    return await next();
  }
}
