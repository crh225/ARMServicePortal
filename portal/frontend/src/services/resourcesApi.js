/**
 * Resources API Service
 * Calls backend API for Azure Resource Graph data
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Fetch all ARM Portal resources
 * @param {object} options - Query options
 * @param {boolean} options.includeCosts - Whether to include cost data (slower)
 * @returns {Promise<object>} Response with resources array
 */
export async function fetchAllResources(options = {}) {
  const { environment, blueprintId, subscriptions, includeCosts } = options;

  const params = new URLSearchParams();
  if (environment) params.append("environment", environment);
  if (blueprintId) params.append("blueprintId", blueprintId);
  if (subscriptions && subscriptions.length > 0) {
    params.append("subscriptions", subscriptions.join(","));
  }
  if (includeCosts) params.append("includeCosts", "true");

  const url = `${API_BASE_URL}/api/resources${params.toString() ? `?${params.toString()}` : ""}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    throw error;
  }
}

/**
 * Fetch resources for a specific request ID (PR number)
 * Used for graph visualization
 * @param {string|number} requestId - Request ID (PR number)
 * @returns {Promise<object>} Response with resources array
 */
export async function fetchResourcesByRequestId(requestId) {
  const url = `${API_BASE_URL}/api/resources/${requestId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch resources for request ${requestId}:`, error);
    throw error;
  }
}
