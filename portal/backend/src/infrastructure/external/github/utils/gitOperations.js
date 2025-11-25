/**
 * Git operations utilities
 * Shared functions for branch and file operations
 */

/**
 * Ensure a branch exists, creating it if necessary
 * If branch exists and forceRecreate is true, deletes and recreates it
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.branchName - Branch name to create
 * @param {string} config.baseSha - Base SHA to create branch from
 * @param {boolean} config.forceRecreate - Whether to recreate if exists
 * @returns {Promise<string>} - The branch name (may be modified if recreated)
 */
export async function ensureBranch(octokit, config) {
  const { owner, repo, branchName, baseSha, forceRecreate = false } = config;

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    });
    return branchName;
  } catch (err) {
    if (err.status === 422) {
      // Branch already exists
      if (forceRecreate) {
        // Delete and recreate with unique name
        const uniqueBranchName = `${branchName}-${Math.random().toString(36).substring(7)}`;
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${uniqueBranchName}`,
          sha: baseSha
        });
        return uniqueBranchName;
      }
      return branchName;
    }
    throw err;
  }
}

/**
 * Commit a file to a branch
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.path - File path
 * @param {string} config.content - File content
 * @param {string} config.message - Commit message
 * @param {string} config.branch - Target branch
 */
export async function commitFile(octokit, config) {
  const { owner, repo, path, content, message, branch } = config;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    branch
  });
}

/**
 * Delete a file from a branch
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.path - File path to delete
 * @param {string} config.message - Commit message
 * @param {string} config.branch - Target branch
 * @param {string} config.sha - File SHA to delete
 */
export async function deleteFile(octokit, config) {
  const { owner, repo, path, message, branch, sha } = config;

  await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
    branch
  });
}

/**
 * Get file content from a specific branch
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.path - File path
 * @param {string} config.ref - Git reference (branch, tag, or commit SHA)
 * @returns {Promise<Object>} - File data with content and sha
 */
export async function getFileContent(octokit, config) {
  const { owner, repo, path, ref } = config;

  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref
  });

  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha
  };
}

/**
 * Check if a file exists on a branch
 * @param {Object} octokit - GitHub client
 * @param {Object} config - Configuration
 * @param {string} config.owner - Repository owner
 * @param {string} config.repo - Repository name
 * @param {string} config.path - File path
 * @param {string} config.ref - Git reference
 * @returns {Promise<boolean>} - True if file exists
 */
export async function fileExists(octokit, config) {
  const { owner, repo, path, ref } = config;

  try {
    await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref
    });
    return true;
  } catch (err) {
    if (err.status === 404) {
      return false;
    }
    throw err;
  }
}
