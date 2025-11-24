import { Entity } from "./Entity.js";
import { BlueprintProvisionedEvent } from "../events/BlueprintProvisionedEvent.js";

/**
 * ProvisionRequest Domain Entity
 * Represents a request to provision infrastructure with business logic
 */
export class ProvisionRequest extends Entity {
  constructor({
    blueprintId,
    blueprintVersion,
    environment,
    variables,
    moduleName,
    createdBy,
    blueprint
  }) {
    super();
    // Validation
    if (!blueprintId) {
      throw new Error("ProvisionRequest requires blueprintId");
    }
    if (!variables || typeof variables !== 'object') {
      throw new Error("ProvisionRequest requires variables object");
    }
    if (!createdBy) {
      throw new Error("ProvisionRequest requires createdBy");
    }

    this.blueprintId = blueprintId;
    this.blueprintVersion = blueprintVersion;
    this.environment = environment || variables.environment || "dev";
    this.variables = { ...variables };
    this.moduleName = moduleName;
    this.createdBy = createdBy;
    this.blueprint = blueprint;
    this.status = "pending";
    this.policyValidation = null;
    this.finalVariables = null;
  }

  /**
   * Validate this provision request against policies
   */
  validatePolicies(policyService) {
    if (!this.blueprint) {
      throw new Error("Blueprint must be set before policy validation");
    }

    const result = policyService.validatePolicies({
      blueprintId: this.blueprintId,
      environment: this.environment,
      variables: this.variables,
      blueprint: this.blueprint
    });

    this.policyValidation = result;

    if (!result.valid) {
      this.status = "policy_failed";
      throw this.createPolicyError(result);
    }

    return result;
  }

  /**
   * Apply auto-filled values from policy validation
   */
  applyAutoFill(policyService) {
    if (!this.policyValidation) {
      throw new Error("Must run validatePolicies before applyAutoFill");
    }

    this.finalVariables = policyService.applyAutoFill(
      this.variables,
      this.policyValidation.autoFilled
    );

    return this.finalVariables;
  }

  /**
   * Check if blueprint supports the target environment
   */
  validateEnvironment() {
    if (!this.blueprint) {
      throw new Error("Blueprint must be set before environment validation");
    }

    if (!this.blueprint.supportsEnvironment(this.environment)) {
      const error = new Error(`Blueprint ${this.blueprintId} does not support environment: ${this.environment}`);
      error.status = 400;
      throw error;
    }
  }

  /**
   * Check if all required variables are provided
   */
  validateRequiredVariables() {
    if (!this.blueprint) {
      throw new Error("Blueprint must be set before variable validation");
    }

    const validation = this.blueprint.validateRequiredVariables(this.variables);

    if (!validation.valid) {
      const error = new Error(`Missing required variables: ${validation.missing.join(', ')}`);
      error.status = 400;
      error.missingVariables = validation.missing;
      throw error;
    }
  }

  /**
   * Mark request as submitted
   */
  markAsSubmitted(gitHubResponse) {
    this.status = "submitted";
    this.pullRequestUrl = gitHubResponse.pullRequestUrl;
    this.branchName = gitHubResponse.branchName;
    this.filePath = gitHubResponse.filePath;
    this.submittedAt = new Date().toISOString();

    // Raise domain event
    this.addDomainEvent(new BlueprintProvisionedEvent(this));
  }

  /**
   * Create policy validation error
   */
  createPolicyError(policyResult) {
    const error = new Error("Policy validation failed");
    error.status = 400;
    error.policyErrors = policyResult.errors;
    error.policyWarnings = policyResult.warnings;
    return error;
  }

  /**
   * Get the result to return to the caller
   */
  toResult() {
    return {
      status: this.status,
      pullRequestUrl: this.pullRequestUrl,
      branchName: this.branchName,
      filePath: this.filePath,
      blueprintVersion: this.blueprint?.version,
      policyWarnings: this.policyValidation?.warnings?.length > 0
        ? this.policyValidation.warnings
        : undefined,
      autoFilled: this.policyValidation?.autoFilled &&
                  Object.keys(this.policyValidation.autoFilled).length > 0
        ? this.policyValidation.autoFilled
        : undefined
    };
  }
}
