/**
 * Legacy exports for backward compatibility
 * All functionality has been moved to modular files in ./github/
 */

export { createGitHubRequest } from "./github/provision.js";
export { listGitHubRequests, getGitHubRequestByNumber } from "./github/pullRequests.js";
