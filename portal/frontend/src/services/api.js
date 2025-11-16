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

    const response = await fetch(`${API_BASE_URL}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("Failed to submit provision request");
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
  }
};

export default api;
