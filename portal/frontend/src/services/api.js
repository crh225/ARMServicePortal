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
   */
  async provisionBlueprint(blueprintId, variables) {
    const response = await fetch(`${API_BASE_URL}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprintId,
        variables
      })
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
  }
};

export default api;
