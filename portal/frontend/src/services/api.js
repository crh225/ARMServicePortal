const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * API service layer for all backend communication
 */
const api = {
  /**
   * Fetch all available blueprints from the catalog
   */
  async fetchBlueprints() {
    const response = await fetch(`${API_BASE_URL}/api/catalog`);
    if (!response.ok) {
      throw new Error("Failed to load blueprints");
    }
    return response.json();
  },

  /**
   * Submit a provision request for a blueprint
   * @param {string} blueprintId - The blueprint ID
   * @param {object} variables - The Terraform variables
   * @param {string} [moduleName] - Optional module name (for updates)
   */
  async provisionBlueprint(blueprintId, variables, moduleName = null) {
    const body = {
      blueprintId,
      variables
    };

    if (moduleName) {
      body.moduleName = moduleName;
    }

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("github_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/provision`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If there are policy errors, return them so the UI can display them
      if (errorData.policyErrors) {
        return {
          error: errorData.error || "Policy validation failed",
          policyErrors: errorData.policyErrors,
          policyWarnings: errorData.policyWarnings
        };
      }
      throw new Error(errorData.details || errorData.error || "Failed to submit provision request");
    }

    return response.json();
  },

  /**
   * Fetch all jobs
   */
  async fetchJobs() {
    const response = await fetch(`${API_BASE_URL}/api/jobs`);
    if (!response.ok) {
      throw new Error("Failed to load jobs");
    }
    return response.json();
  },

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetail(jobNumber) {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobNumber}`);
    if (!response.ok) {
      throw new Error("Failed to load job details");
    }
    return response.json();
  },

  /**
   * Create a destroy PR for a deployed resource
   */
  async destroyResource(resourceNumber) {
    const response = await fetch(`${API_BASE_URL}/api/destroy/${resourceNumber}`, {
      method: "POST"
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to create destroy PR");
    }
    return response.json();
  },

  /**
   * Promote a deployed resource to the next environment
   */
  async promoteResource(resourceNumber) {
    const response = await fetch(`${API_BASE_URL}/api/promote/${resourceNumber}`, {
      method: "POST"
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to create promotion PR");
    }
    return response.json();
  },

  /**
   * Get cost estimate for a blueprint configuration
   * @param {string} blueprintId - The blueprint ID
   * @param {object} variables - The Terraform variables
   */
  async getCostEstimate(blueprintId, variables) {
    const response = await fetch(`${API_BASE_URL}/api/pricing/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprintId,
        variables
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cost estimate");
    }

    return response.json();
  },

  /**
   * Fetch all deployed resources
   * Note: By default, cost data is NOT fetched to improve performance
   * Pass includeCosts=true query param to fetch actual cost data
   */
  async fetchResources(includeCosts = true) {
    const url = new URL(`${API_BASE_URL}/api/resources`);
    url.searchParams.set("includeCosts", includeCosts.toString());

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load resources");
    }
    const data = await response.json();
    // API returns { resources: [], count, skip, top } - extract just the resources array
    return Array.isArray(data) ? data : (data.resources || []);
  },

  /**
   * Fetch all accessible Azure subscriptions
   */
  async fetchSubscriptions() {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions`);
    if (!response.ok) {
      throw new Error("Failed to load subscriptions");
    }
    const data = await response.json();
    return data.subscriptions || [];
  },

  /**
   * Fetch Terraform state backups
   * @param {string} [environment] - Optional environment filter (dev, qa, staging, prod)
   */
  async fetchBackups(environment = null) {
    const url = environment
      ? `${API_BASE_URL}/api/backups/${environment}`
      : `${API_BASE_URL}/api/backups`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load backups");
    }
    const data = await response.json();
    return data.backups || [];
  }
};

export default api;
