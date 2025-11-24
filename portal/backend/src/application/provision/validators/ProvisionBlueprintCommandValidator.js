/**
 * Provision Blueprint Command Validator
 * Validates provision requests before execution
 */
import { IValidator, ValidationResult } from "../../contracts/IValidator.js";

export class ProvisionBlueprintCommandValidator extends IValidator {
  validate(command) {
    const result = new ValidationResult();

    // Validate blueprintId
    if (!command.blueprintId || typeof command.blueprintId !== "string") {
      result.addError("blueprintId", "Blueprint ID is required and must be a string");
    }

    // Validate environment
    const validEnvironments = ["dev", "qa", "staging", "prod"];
    if (!command.environment) {
      result.addError("environment", "Environment is required");
    } else if (!validEnvironments.includes(command.environment)) {
      result.addError(
        "environment",
        `Environment must be one of: ${validEnvironments.join(", ")}`
      );
    }

    // Validate variables (must be an object if provided)
    if (command.variables !== undefined && command.variables !== null) {
      if (typeof command.variables !== "object" || Array.isArray(command.variables)) {
        result.addError("variables", "Variables must be an object");
      }
    }

    // Validate moduleName (optional but must be string if provided)
    if (command.moduleName !== undefined && command.moduleName !== null) {
      if (typeof command.moduleName !== "string" || command.moduleName.trim() === "") {
        result.addError("moduleName", "Module name must be a non-empty string if provided");
      }
    }

    return result;
  }
}
