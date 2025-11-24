/**
 * Pull Request operations utilities
 * Shared functions for PR creation and management
 */

/**
 * Create a pull request
 * @param {Object} octokit - GitHub client
 * @param {Object} config - PR configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.title - PR title
 * @param {string} config.body - PR description
 * @param {string} config.head - Source branch
 * @param {string} config.base - Target branch
 * @returns {Promise<Object>} - Created PR data
 */
export async function createPR(octokit, config) {
  const { owner, repo, title, body, head, base } = config;

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base
  });

  return pr;
}

/**
 * Update PR labels
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {number} config.issueNumber - PR number
 * @param {string[]} config.labels - Labels to add
 */
export async function updatePRLabels(octokit, config) {
  const { owner, repo, issueNumber, labels } = config;

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels
  });
}

/**
 * Add a comment to a PR
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {number} config.issueNumber - PR number
 * @param {string} config.body - Comment body
 */
export async function addPRComment(octokit, config) {
  const { owner, repo, issueNumber, body } = config;

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
}

/**
 * Generate PR description with metadata
 * @param {Object} metadata - Metadata to include
 * @param {string} metadata.blueprintId - Blueprint ID
 * @param {string} metadata.version - Blueprint version
 * @param {string} metadata.environment - Target environment
 * @param {string} metadata.createdBy - Username who created the request
 * @param {string} metadata.terraformModule - Terraform module name
 * @param {string} description - Additional description text
 * @returns {string} - Formatted PR body
 */
export function generatePRBody(metadata, description = "") {
  const parts = [];

  if (description) {
    parts.push(description);
    parts.push("");
  }

  parts.push("---");
  parts.push("**Metadata:**");

  if (metadata.blueprintId) {
    parts.push(`- Blueprint: \`${metadata.blueprintId}\``);
  }

  if (metadata.version) {
    parts.push(`- Version: \`${metadata.version}\``);
  }

  if (metadata.environment) {
    parts.push(`- Environment: \`${metadata.environment}\``);
  }

  if (metadata.createdBy) {
    parts.push(`- Created by: @${metadata.createdBy}`);
  }

  if (metadata.terraformModule) {
    parts.push(`- Terraform Module: \`${metadata.terraformModule}\``);
  }

  return parts.join("\n");
}
