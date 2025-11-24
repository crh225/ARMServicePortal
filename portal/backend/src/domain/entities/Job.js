import { Entity } from "./Entity.js";
import { ResourceDestroyedEvent } from "../events/ResourceDestroyedEvent.js";

/**
 * Job Domain Entity
 * Represents a deployment job/resource with business logic
 */
export class Job extends Entity {
  constructor(data) {
    super();
    // Accept either prNumber or number (GitHub PR data uses 'number')
    const prNumber = data.prNumber || data.number;

    if (!prNumber || !Number.isInteger(prNumber)) {
      throw new Error("Job requires valid prNumber");
    }

    this.prNumber = prNumber;
    this.environment = data.environment || null;
    this.blueprintId = data.blueprintId || null;
    this.blueprintVersion = data.blueprintVersion || null;
    this.moduleName = data.moduleName || null;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || null;
    this.merged = data.merged || false;
    this.mergedAt = data.mergedAt || null;
    this.status = data.status || "pending";
    this.variables = data.variables || {};
    this.resources = data.resources || [];
    this.workflowRuns = data.workflowRuns || [];
  }

  /**
   * Check if job can be promoted
   */
  canPromote() {
    const errors = [];

    if (!this.merged) {
      errors.push("Resource must be merged and deployed before promotion");
    }

    if (!this.environment) {
      errors.push("Source resource has no environment specified");
    }

    if (this.environment === "prod") {
      errors.push("Cannot promote from production - it is the final environment");
    }

    return {
      canPromote: errors.length === 0,
      errors
    };
  }

  /**
   * Get the next environment in the promotion path
   */
  getNextEnvironment() {
    const environmentPath = {
      dev: "qa",
      qa: "staging",
      staging: "prod",
      prod: null
    };

    return environmentPath[this.environment];
  }

  /**
   * Validate promotion is possible
   */
  validatePromotion() {
    const promotionCheck = this.canPromote();

    if (!promotionCheck.canPromote) {
      const error = new Error(promotionCheck.errors[0]);
      error.status = 400;
      error.details = promotionCheck.errors.join("; ");
      throw error;
    }

    const targetEnvironment = this.getNextEnvironment();
    if (!targetEnvironment) {
      const error = new Error("Cannot promote from production");
      error.status = 400;
      error.details = "Production is the final environment";
      throw error;
    }

    return targetEnvironment;
  }

  /**
   * Check if job is in a terminal state
   */
  isTerminal() {
    const terminalStatuses = ["merged", "closed", "failed", "cancelled"];
    return terminalStatuses.includes(this.status);
  }

  /**
   * Check if job is active
   */
  isActive() {
    return this.merged && !this.isTerminal();
  }

  /**
   * Update job status
   */
  updateStatus(newStatus) {
    const validStatuses = ["pending", "running", "merged", "closed", "failed", "cancelled"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid job status: ${newStatus}`);
    }

    this.status = newStatus;

    if (newStatus === "merged" && !this.mergedAt) {
      this.mergedAt = new Date().toISOString();
      this.merged = true;
    }
  }

  /**
   * Add resources to this job
   */
  addResources(resources) {
    if (!Array.isArray(resources)) {
      throw new Error("Resources must be an array");
    }

    this.resources = [...this.resources, ...resources];
  }

  /**
   * Add workflow run to this job
   */
  addWorkflowRun(workflowRun) {
    this.workflowRuns.push(workflowRun);
  }

  /**
   * Mark job as destroyed
   */
  markAsDestroyed(pullRequestUrl) {
    this.status = "destroying";
    this.destroyPullRequestUrl = pullRequestUrl;

    // Raise domain event
    this.addDomainEvent(new ResourceDestroyedEvent(this.prNumber, pullRequestUrl));
  }

  /**
   * Get job DTO for API responses
   */
  toDTO() {
    return {
      prNumber: this.prNumber,
      environment: this.environment,
      blueprintId: this.blueprintId,
      blueprintVersion: this.blueprintVersion,
      moduleName: this.moduleName,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      merged: this.merged,
      mergedAt: this.mergedAt,
      status: this.status,
      variables: this.variables,
      resources: this.resources,
      workflowRuns: this.workflowRuns,
      canPromote: this.canPromote().canPromote,
      nextEnvironment: this.getNextEnvironment()
    };
  }
}
