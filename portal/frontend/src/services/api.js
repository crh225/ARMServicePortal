const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Get LogRocket session URL if available
 * LogRocket.getSessionURL() is async and returns via callback
 */
function getLogRocketSessionURL(callback) {
  try {
    if (window.LogRocket && typeof window.LogRocket.getSessionURL === 'function') {
      window.LogRocket.getSessionURL(callback);
      return;
    }
  } catch (e) {
    // LogRocket not available or error getting session URL
  }
  callback(null);
}

/**
 * Enhanced fetch that includes LogRocket session URL
 */
async function fetchWithLogRocket(url, options = {}) {
  const headers = options.headers || {};

  // Add LogRocket session URL if available (async)
  return new Promise((resolve) => {
    getLogRocketSessionURL((sessionURL) => {
      if (sessionURL) {
        headers['X-LogRocket-Session'] = sessionURL;
      }

      resolve(fetch(url, {
        ...options,
        headers
      }));
    });
  });
}

/**
 * API service layer for all backend communication
 */
const api = {
  // In-memory cache for API responses
  _cache: {},

  /**
   * Fetch all available blueprints from the catalog
   */
  async fetchBlueprints() {
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/catalog`);
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

    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/provision`, {
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
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/jobs`);
    if (!response.ok) {
      throw new Error("Failed to load jobs");
    }
    return response.json();
  },

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetail(jobNumber) {
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/jobs/${jobNumber}`);
    if (!response.ok) {
      throw new Error("Failed to load job details");
    }
    return response.json();
  },

  /**
   * Create a destroy PR for a deployed resource
   */
  async destroyResource(resourceNumber) {
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/destroy/${resourceNumber}`, {
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
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/promote/${resourceNumber}`, {
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
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/pricing/estimate`, {
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

    const response = await fetchWithLogRocket(url);
    if (!response.ok) {
      throw new Error("Failed to load resources");
    }
    const data = await response.json();
    // API returns { resources: [], count, skip, top } - extract just the resources array
    return Array.isArray(data) ? data : (data.resources || []);
  },

  /**
   * Fetch all accessible Azure subscriptions
   * Cached for 5 minutes to avoid repeated API calls
   */
  async fetchSubscriptions() {
    const CACHE_KEY = 'subscriptions_cache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Check cache first
    const cached = this._cache[CACHE_KEY];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Fetch fresh data
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/subscriptions`);
    if (!response.ok) {
      throw new Error("Failed to load subscriptions");
    }
    const data = await response.json();
    const subscriptions = data.subscriptions || [];

    // Store in cache
    this._cache[CACHE_KEY] = {
      data: subscriptions,
      timestamp: Date.now()
    };

    return subscriptions;
  },

  /**
   * Fetch Terraform state backups
   * @param {string} [environment] - Optional environment filter (dev, qa, staging, prod)
   */
  async fetchBackups(environment = null) {
    const url = environment
      ? `${API_BASE_URL}/api/backups/${environment}`
      : `${API_BASE_URL}/api/backups`;

    const response = await fetchWithLogRocket(url);
    if (!response.ok) {
      throw new Error("Failed to load backups");
    }
    const data = await response.json();
    return data.backups || [];
  },

  /**
   * Generate Terraform code for an Azure resource
   * @param {string} resourceId - Azure resource ID
   * @param {boolean} [useModules=true] - If true, use blueprint modules; if false, generate raw resources
   * @returns {Promise<object>} Generated Terraform code and metadata
   */
  async generateTerraformCode(resourceId, useModules = true) {
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/terraform/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId, useModules })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate Terraform code");
    }

    return response.json();
  },

  /**
   * Fetch container repositories from ACR
   * Cached for 2 minutes
   */
  async fetchContainerRepositories() {
    const CACHE_KEY = 'acr_repositories_cache';
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

    // Check cache first
    const cached = this._cache[CACHE_KEY];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/registry/repositories`);
    if (!response.ok) {
      throw new Error("Failed to load container repositories");
    }
    const data = await response.json();

    // Store in cache
    this._cache[CACHE_KEY] = {
      data,
      timestamp: Date.now()
    };

    return data;
  },

  /**
   * Fetch tags for a specific container repository
   * Cached for 1 minute per repository
   */
  async fetchContainerTags(repositoryName) {
    const CACHE_KEY = `acr_tags_${repositoryName}`;
    const CACHE_TTL = 1 * 60 * 1000; // 1 minute

    // Check cache first
    const cached = this._cache[CACHE_KEY];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetchWithLogRocket(
      `${API_BASE_URL}/api/registry/repositories/${encodeURIComponent(repositoryName)}/tags`
    );
    if (!response.ok) {
      throw new Error(`Failed to load tags for ${repositoryName}`);
    }
    const data = await response.json();

    // Store in cache
    this._cache[CACHE_KEY] = {
      data,
      timestamp: Date.now()
    };

    return data;
  },

  /**
   * Fetch homepage stats (cached server-side for 12 hours)
   * Returns: { blueprints, resources, jobs, cached, cachedAt }
   */
  async fetchHomeStats() {
    const response = await fetchWithLogRocket(`${API_BASE_URL}/api/stats`);
    if (!response.ok) {
      throw new Error("Failed to load stats");
    }
    return response.json();
  }
};

export default api;
