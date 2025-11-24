/**
 * Promote Resource Command Validator
 * Validates promotion requests before execution
 */
import { IValidator, ValidationResult } from "../../contracts/IValidator.js";

export class PromoteResourceCommandValidator extends IValidator {
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
