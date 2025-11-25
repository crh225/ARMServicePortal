/**
 * Destroy Resource Command Validator
 * Validates destroy requests before execution
 */
import { IValidator, ValidationResult } from "../../contracts/IValidator.js";

export class DestroyResourceCommandValidator extends IValidator {
  validate(command) {
    const result = new ValidationResult();

    // Validate prNumberValue
    if (!command.prNumberValue) {
      result.addError("prNumberValue", "PR number is required");
    } else if (!Number.isInteger(parseInt(command.prNumberValue))) {
      result.addError("prNumberValue", "PR number must be a valid integer");
    }

    return result;
  }
}
