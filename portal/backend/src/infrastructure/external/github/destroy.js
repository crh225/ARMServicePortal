import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { ensureBranch, deleteFile, getFileContent, fileExists } from "./utils/gitOperations.js";
import { createPR, updatePRLabels } from "./utils/prOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../../config/githubConstants.js";

/**
 * Get original PR details and validate it can be destroyed
 */
async function getOriginalPR(octokit, owner, repo, prNumber) {
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  if (!pr.merged_at) {
    throw new Error("Cannot delete resource - PR not merged");
  }

  const headRef = pr.head?.ref;
  if (!headRef || !headRef.startsWith("requests/")) {
    throw new Error("Invalid PR - not a resource request");
  }

  return pr;
}

/**
 * Find the Terraform file from the original PR
 */
async function findTerraformFile(octokit, owner, repo, prNumber) {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });

  const tfFile = files.find(f => f.filename.endsWith(".tf"));
  if (!tfFile) {
    throw new Error("No Terraform file found in original PR");
  }

  return tfFile;
}

/**
 * Generate destroy branch name from original request branch
 */
function generateDestroyBranchName(headRef) {
  return `destroy/${headRef.replace("requests/", "")}`;
}

/**
 * Delete the Terraform file or create destroy marker
 */
async function handleFileDestruction(octokit, config) {
  const { owner, repo, filePath, baseBranch, destroyBranch } = config;

  // Check if file exists on base branch
  const exists = await fileExists(octokit, {
    owner,
    repo,
    path: filePath,
    ref: baseBranch
  });

  if (exists) {
    // File exists on base - delete it
    const fileData = await getFileContent(octokit, {
      owner,
      repo,
      path: filePath,
      ref: baseBranch
    });

    await deleteFile(octokit, {
      owner,
      repo,
      path: filePath,
      message: `destroy: remove ${filePath}`,
      branch: destroyBranch,
      sha: fileData.sha
    });

    return { fileExistsOnBase: true };
  } else {
    // File doesn't exist on base - create marker file
    const markerPath = filePath.replace('.tf', '.destroy');
    const markerContent = `# Destroy marker for ${filePath}\n# This file triggers terraform destroy for the associated resources\n`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: markerPath,
      message: `destroy: mark ${filePath} for destruction`,
      content: Buffer.from(markerContent, "utf8").toString("base64"),
      branch: destroyBranch
    });

    return { fileExistsOnBase: false };
  }
}

/**
 * Generate destroy PR body
 */
function generateDestroyPRBody(prNumber, filePath, fileExistsOnBase) {
  return [
    `## Destroy Resource`,
    ``,
    `This PR will destroy the infrastructure deployed in #${prNumber}.`,
    ``,
    `**Original PR**: #${prNumber}`,
    `**Resource File**: \`${filePath}\``,
    fileExistsOnBase ? `` : `**Note**: Resource file not on base branch - using marker file for destroy`,
    ``,
    `Warning: Merging this PR will run \`terraform destroy\` and permanently delete the deployed resources.`,
    ``,
    `---`,
    `<!-- metadata:destroys-pr:${prNumber} -->`,
  ].filter(Boolean).join("\n");
}

/**
 * Create a PR to delete a deployed resource (runs terraform destroy)
 * @param {number} prNumber - The PR number of the deployed resource
 * @returns {Promise<Object>} - The created PR details
 */
export async function createDestroyPR(prNumber) {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // Get and validate original PR
  const originalPR = await getOriginalPR(octokit, infraOwner, infraRepo, prNumber);

  // Find Terraform file
  const tfFile = await findTerraformFile(octokit, infraOwner, infraRepo, prNumber);

  // Generate destroy branch name
  const destroyBranchName = generateDestroyBranchName(originalPR.head.ref);
  const baseBranch = originalPR.base?.ref || DEFAULT_BASE_BRANCH;

  // Get base branch SHA
  const { data: baseBranchRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  // Create destroy branch (force recreate if exists)
  await ensureBranch(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    branchName: destroyBranchName,
    baseSha: baseBranchRef.object.sha,
    forceRecreate: true
  });

  // Delete file or create marker
  const { fileExistsOnBase } = await handleFileDestruction(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    filePath: tfFile.filename,
    baseBranch,
    destroyBranch: destroyBranchName
  });

  // Generate PR body
  const prBody = generateDestroyPRBody(prNumber, tfFile.filename, fileExistsOnBase);

  // Create destroy PR
  const destroyPR = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title: `Destroy: ${originalPR.title}`,
    head: destroyBranchName,
    base: baseBranch,
    body: prBody
  });

  // Add labels
  await updatePRLabels(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    issueNumber: destroyPR.number,
    labels: ["terraform-destroy", `destroys-pr-${prNumber}`]
  });

  return {
    number: destroyPR.number,
    url: destroyPR.html_url,
    branch: destroyBranchName,
    title: destroyPR.title
  };
}
