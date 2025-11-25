/**
 * Generate Terraform Code Query Validator
 * Validates terraform code generation requests before execution
 */
import { IValidator, ValidationResult } from "../../contracts/IValidator.js";

export class GenerateTerraformCodeQueryValidator extends IValidator {
  validate(query) {
    const result = new ValidationResult();

    // Validate resourceId
    if (!query.resourceId) {
      result.addError("resourceId", "Resource ID is required");
    } else if (typeof query.resourceId !== "string") {
      result.addError("resourceId", "Resource ID must be a string");
    } else if (!query.resourceId.startsWith("/subscriptions/")) {
      result.addError("resourceId", "Resource ID must be a valid Azure resource ID (starting with /subscriptions/)");
    }

    return result;
  }
}
