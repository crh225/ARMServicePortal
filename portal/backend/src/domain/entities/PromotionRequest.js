import { Entity } from "./Entity.js";
import { ResourcePromotedEvent } from "../events/ResourcePromotedEvent.js";

/**
 * PromotionRequest Domain Entity
 * Represents a request to promote infrastructure between environments
 */
export class PromotionRequest extends Entity {
  constructor({ sourceJob, targetEnvironment }) {
    super();
    if (!sourceJob) {
      throw new Error("PromotionRequest requires sourceJob");
    }

    this.sourceJob = sourceJob;
    this.targetEnvironment = targetEnvironment;
    this.status = "pending";
    this.policyValidation = null;
    this.promotionPR = null;
  }

  /**
   * Validate the promotion request
   */
  validate() {
    this.targetEnvironment = this.sourceJob.validatePromotion();
  }

  /**
   * Validate promotion against policies
   */
  validatePolicies(policyService) {
    if (!this.targetEnvironment) {
      throw new Error("Must validate promotion before policy validation");
    }

    const result = policyService.validatePromotion(
      this.sourceJob,
      this.targetEnvironment
    );

    this.policyValidation = result;

    if (!result.valid) {
      this.status = "policy_failed";
      throw this.createPolicyError(result);
    }

    return result;
  }

  /**
   * Mark promotion as submitted
   */
  markAsSubmitted(promotionPR) {
    this.status = "submitted";
    this.promotionPR = promotionPR;
    this.submittedAt = new Date().toISOString();

    // Raise domain event
    this.addDomainEvent(new ResourcePromotedEvent(this));
  }

  /**
   * Create policy validation error
   */
  createPolicyError(policyResult) {
    const error = new Error("Promotion validation failed");
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
      success: this.status === "submitted",
      message: `Promotion PR created: ${this.sourceJob.environment} → ${this.targetEnvironment}`,
      sourceEnvironment: this.sourceJob.environment,
      targetEnvironment: this.targetEnvironment,
      pr: this.promotionPR,
      policyWarnings: this.policyValidation?.warnings?.length > 0
        ? this.policyValidation.warnings
        : undefined
    };
  }
}
