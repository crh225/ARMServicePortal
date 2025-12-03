/**
 * Blueprint Domain Entity
 * Represents a blueprint with business logic and validation
 */
export class Blueprint {
  constructor({ id, name, version, description, variables, policies, metadata, provider, category, outputs, estimatedMonthlyCost, crossplane, costDetails }) {
    if (!id) {
      throw new Error("Blueprint must have an id");
    }
    if (!name) {
      throw new Error("Blueprint must have a name");
    }
    if (!version) {
      throw new Error("Blueprint must have a version");
    }

    this.id = id;
    this.name = name;
    this.version = version;
    this.description = description || "";
    this.variables = variables || {};
    this.policies = policies || [];
    this.metadata = metadata || {};
    this.provider = provider || "terraform";
    this.category = category || null;
    this.outputs = outputs || [];
    this.estimatedMonthlyCost = estimatedMonthlyCost !== undefined ? estimatedMonthlyCost : null;
    this.crossplane = crossplane || null;
    this.costDetails = costDetails || null;
  }

  /**
   * Check if this blueprint supports a specific environment
   */
  supportsEnvironment(environment) {
    if (!this.policies || this.policies.length === 0) {
      return true; // No policies = all environments allowed
    }

    const envPolicies = this.policies.filter(p => p.type === 'environment');
    if (envPolicies.length === 0) {
      return true;
    }

    return envPolicies.some(p =>
      p.allowedEnvironments && p.allowedEnvironments.includes(environment)
    );
  }

  /**
   * Get required variables for this blueprint
   */
  getRequiredVariables() {
    return Object.entries(this.variables)
      .filter(([_, config]) => config.required === true)
      .map(([name, config]) => ({ name, ...config }));
  }

  /**
   * Get optional variables for this blueprint
   */
  getOptionalVariables() {
    return Object.entries(this.variables)
      .filter(([_, config]) => config.required !== true)
      .map(([name, config]) => ({ name, ...config }));
  }

  /**
   * Validate that all required variables are provided
   */
  validateRequiredVariables(providedVariables) {
    const required = this.getRequiredVariables();

    // Filter out non-Terraform variables (handled at provider/environment level)
    const NON_TERRAFORM_VARS = ['subscription_id'];

    const missing = required
      .filter(v => !NON_TERRAFORM_VARS.includes(v.name))  // Exclude non-Terraform vars
      .filter(v => !(v.name in providedVariables))
      .map(v => v.name);

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get display information
   */
  toDTO() {
    return {
      id: this.id,
      displayName: this.name,
      version: this.version,
      description: this.description,
      variables: this.variables,
      policies: this.policies,
      metadata: this.metadata,
      provider: this.provider,
      category: this.category,
      outputs: this.outputs,
      estimatedMonthlyCost: this.estimatedMonthlyCost,
      crossplane: this.crossplane
    };
  }
}
