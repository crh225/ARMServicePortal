/**
 * Destroy Resource Command Validator
 * Validates destroy requests before execution
 */
import { IValidator, ValidationResult } from "../../contracts/IValidator.js";

export class DestroyResourceCommandValidator extends IValidator {
  validate(command) {
    const result = new ValidationResult();

    // Validate prNumber
    if (!command.prNumber) {
      result.addError("prNumber", "PR number is required");
    } else if (!Number.isInteger(command.prNumber) || command.prNumber <= 0) {
      result.addError("prNumber", "PR number must be a positive integer");
    }

    return result;
  }
}
