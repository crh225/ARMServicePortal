/**
 * Resource Domain Entity
 * Represents an Azure resource with business logic
 */
export class Resource {
  constructor(data) {
    if (!data.id) {
      throw new Error("Resource requires id");
    }

    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.location = data.location;
    this.resourceGroup = data.resourceGroup;
    this.subscriptionId = data.subscriptionId;
    this.tags = data.tags || {};
    this.properties = data.properties || {};
    this.provisioningState = data.provisioningState || null;
    this.health = data.health || null;
    this.cost = data.cost || null;
    this.estimatedMonthlyCost = data.estimatedMonthlyCost || null;
    this.prNumber = data.prNumber || null;
    this.pr = data.pr || null;
  }

  /**
   * Check if this resource is a Resource Group
   */
  isResourceGroup() {
    return (this.type || "").toLowerCase() === "microsoft.resources/resourcegroups";
  }

  /**
   * Check if this resource is a Subscription
   */
  isSubscription() {
    return (this.type || "").toLowerCase() === "microsoft.resources/subscriptions";
  }

  /**
   * Get the environment this resource belongs to
   */
  getEnvironment() {
    return this.tags["armportal-environment"] || null;
  }

  /**
   * Get the blueprint ID this resource was created from
   */
  getBlueprintId() {
    return this.tags["armportal-blueprint"] || null;
  }

  /**
   * Get the request ID that created this resource
   */
  getRequestId() {
    return this.tags["armportal-request-id"] || null;
  }

  /**
   * Parse request ID to determine if it's a PR number or module name
   * @returns {{ prNumber: number|null, moduleName: string|null }}
   */
  parseRequestId() {
    const requestId = this.getRequestId();
    if (!requestId) {
      return { prNumber: null, moduleName: null };
    }

    const prNumber = parseInt(requestId, 10);
    if (!isNaN(prNumber)) {
      return { prNumber, moduleName: null };
    }

    // Legacy: module name (for resources created before PR number tagging)
    return { prNumber: null, moduleName: requestId };
  }

  /**
   * Derive provisioning state and health based on resource type
   * Some resource types don't have these properties
   */
  deriveHealthState() {
    // Subscriptions and resource groups don't have provisioning state
    if (this.isSubscription() || this.isResourceGroup()) {
      return { provisioningState: null, health: null };
    }

    const provisioningState = this.properties?.provisioningState || null;
    return {
      provisioningState,
      health: provisioningState // Health is derived from provisioning state
    };
  }

  /**
   * Get the owner of this resource
   */
  getOwner() {
    return this.tags["armportal-owner"] || null;
  }

  /**
   * Check if resource is healthy
   */
  isHealthy() {
    if (!this.health) {
      return true; // No health info = assume healthy
    }

    const healthyStates = ["succeeded", "healthy", "available", "running"];
    return healthyStates.includes(this.health.toLowerCase());
  }

  /**
   * Check if resource is provisioned
   */
  isProvisioned() {
    if (!this.provisioningState) {
      return true; // No state = assume provisioned
    }

    return this.provisioningState.toLowerCase() === "succeeded";
  }

  /**
   * Check if resource is in a failed state
   */
  isFailed() {
    const failedStates = ["failed", "error", "unhealthy"];

    if (this.provisioningState) {
      return failedStates.includes(this.provisioningState.toLowerCase());
    }

    if (this.health) {
      return failedStates.includes(this.health.toLowerCase());
    }

    return false;
  }

  /**
   * Check if resource is in progress
   */
  isInProgress() {
    const inProgressStates = ["creating", "updating", "deleting", "provisioning", "pending"];

    if (this.provisioningState) {
      return inProgressStates.includes(this.provisioningState.toLowerCase());
    }

    return false;
  }

  /**
   * Get resource status
   */
  getStatus() {
    if (this.isFailed()) {
      return "failed";
    }

    if (this.isInProgress()) {
      return "in_progress";
    }

    if (this.isProvisioned() && this.isHealthy()) {
      return "healthy";
    }

    return "unknown";
  }

  /**
   * Check if resource has cost data
   */
  hasCostData() {
    return this.cost !== null && this.cost !== undefined;
  }

  /**
   * Check if resource has estimated cost data
   */
  hasEstimatedCost() {
    return this.estimatedMonthlyCost !== null && this.estimatedMonthlyCost !== undefined;
  }

  /**
   * Get total cost (actual + estimated)
   */
  getTotalCost() {
    if (this.hasCostData()) {
      return this.cost;
    }

    if (this.hasEstimatedCost()) {
      return this.estimatedMonthlyCost;
    }

    return 0;
  }

  /**
   * Enrich resource with PR data
   */
  enrichWithPR(pr) {
    this.pr = pr;

    if (pr && pr.number) {
      this.prNumber = pr.number;
    }
  }

  /**
   * Enrich resource with cost data
   */
  enrichWithCost(cost) {
    this.cost = cost;
  }

  /**
   * Enrich resource with estimated cost
   */
  enrichWithEstimatedCost(estimatedCost) {
    this.estimatedMonthlyCost = estimatedCost;
  }

  /**
   * Get DTO for API responses
   */
  toDTO() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      location: this.location,
      resourceGroup: this.resourceGroup,
      subscriptionId: this.subscriptionId,
      tags: this.tags,
      properties: this.properties,
      environment: this.getEnvironment(),
      blueprintId: this.getBlueprintId(),
      requestId: this.getRequestId(),
      owner: this.getOwner(),
      health: this.health,
      provisioningState: this.provisioningState,
      cost: this.cost,
      estimatedMonthlyCost: this.estimatedMonthlyCost,
      prNumber: this.prNumber,
      pr: this.pr,
      status: this.getStatus(),
      isHealthy: this.isHealthy(),
      hasCostData: this.hasCostData()
    };
  }

  /**
   * Extract PR numbers and module names from a collection of resources
   * @param {Resource[]} resources - Array of Resource entities
   * @returns {{ prNumbers: number[], moduleNames: string[] }}
   */
  static extractRequestIds(resources) {
    const prNumbers = new Set();
    const moduleNames = new Set();

    resources.forEach(resource => {
      const { prNumber, moduleName } = resource.parseRequestId();
      if (prNumber) {
        prNumbers.add(prNumber);
      }
      if (moduleName) {
        moduleNames.add(moduleName);
      }
    });

    return {
      prNumbers: Array.from(prNumbers),
      moduleNames: Array.from(moduleNames)
    };
  }

  /**
   * Get the base module name (strips the unique suffix)
   * Used for looking up PRs for legacy module names
   * @param {string} moduleName - The module name from the tag
   * @returns {string} The base module name
   */
  static getBaseModuleName(moduleName) {
    if (!moduleName) return null;
    return moduleName.includes('_')
      ? moduleName.split('_').slice(0, -1).join('_')
      : moduleName;
  }
}
