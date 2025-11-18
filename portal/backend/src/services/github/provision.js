import crypto from "crypto";
import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { getBlueprintById } from "../../config/blueprints.js";
import { renderTerraformModule } from "../../utils/terraformRenderer.js";
import { isStack, renderStackTerraform } from "../../utils/stackRenderer.js";
import { ensureBranch, commitFile, getFileContent } from "./utils/gitOperations.js";
import { createPR, generatePRBody } from "./utils/prOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../config/githubConstants.js";

/**
 * Generate a unique branch name for provision request
 */
function generateBranchName(environment, blueprintId, moduleName, isUpdate) {
  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (isUpdate) {
    return `requests/${environment}/${moduleName}-update-${shortId}`;
  }
  return `requests/${environment}/${safeBlueprint}-${shortId}`;
}

/**
 * Generate module name (either provided or new)
 */
function getModuleName(blueprintId, providedModuleName) {
  if (providedModuleName) {
    return { moduleName: providedModuleName, isUpdate: true, shortId: null };
  }

  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const moduleName = `${safeBlueprint}_${shortId}`;

  return { moduleName, isUpdate: false, shortId };
}

/**
 * Get file SHA if updating existing file
 */
async function getExistingFileSha(octokit, owner, repo, filePath, baseBranch) {
  try {
    const fileData = await getFileContent(octokit, {
      owner,
      repo,
      path: filePath,
      ref: baseBranch
    });
    return fileData.sha;
  } catch (err) {
    if (err.status === 404) {
      return null; // File doesn't exist
    }
    throw err;
  }
}

/**
 * Creates a branch + Terraform module file + PR in the infrastructure repo
 *
 * It writes a .tf file under:
 *   infra/environments/{environment}/{moduleName}.tf
 *
 * @param {string} environment - The target environment
 * @param {string} blueprintId - The blueprint ID
 * @param {string} [blueprintVersion] - Optional blueprint version
 * @param {object} variables - The Terraform variables
 * @param {string} [moduleName] - Optional module name (for updates). If not provided, generates a new one.
 * @param {string} [createdBy] - GitHub username of the user who created this request
 */
export async function createGitHubRequest({ environment, blueprintId, blueprintVersion, variables, moduleName: providedModuleName, createdBy }) {
  const blueprint = getBlueprintById(blueprintId, blueprintVersion);
  if (!blueprint) {
    throw new Error(`Unknown blueprintId: ${blueprintId}${blueprintVersion ? `@${blueprintVersion}` : ''}`);
  }

  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // Get default branch SHA
  const { data: repo } = await octokit.repos.get({
    owner: infraOwner,
    repo: infraRepo
  });

  const baseBranch = repo.default_branch || DEFAULT_BASE_BRANCH;

  const { data: baseRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  const baseSha = baseRef.object.sha;

  // Determine module name and whether this is an update
  const { moduleName, isUpdate, shortId } = getModuleName(blueprintId, providedModuleName);

  // Create branch
  const branchName = generateBranchName(environment, blueprintId, moduleName, isUpdate);

  await ensureBranch(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    branchName,
    baseSha
  });

  // Render Terraform (handles both single blueprints and stacks)
  let tfContent;
  if (isStack(blueprint)) {
    tfContent = renderStackTerraform(blueprint, variables, moduleName);
  } else {
    tfContent = renderTerraformModule({
      moduleName,
      blueprint,
      variables
    });
  }

  const filePath = `infra/environments/${environment}/${moduleName}.tf`;

  // Get existing file SHA if updating
  const fileSha = isUpdate
    ? await getExistingFileSha(octokit, infraOwner, infraRepo, filePath, baseBranch)
    : null;

  // Determine commit message
  const commitMessage = isUpdate
    ? `chore: update ${blueprintId} in ${environment} (${moduleName})`
    : `chore: request ${blueprintId} in ${environment} (${shortId})`;

  // Commit file
  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(tfContent, "utf8").toString("base64"),
    branch: branchName,
    ...(fileSha && { sha: fileSha })
  });

  // Create PR
  const title = isUpdate
    ? `Update ${blueprint.displayName} in ${environment} (${moduleName})`
    : `Provision ${blueprint.displayName} in ${environment} (${shortId})`;

  const description = [
    isUpdate ? `**Update**: Modifying existing resource \`${moduleName}\`` : "",
    "",
    "Rendered module:",
    "```hcl",
    tfContent,
    "```"
  ].filter(Boolean).join("\n");

  const body = generatePRBody({
    blueprintId,
    environment,
    createdBy,
    terraformModule: moduleName,
    version: blueprint.version
  }, description);

  const pr = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title,
    head: branchName,
    base: baseBranch,
    body
  });

  return {
    branchName,
    filePath,
    pullRequestUrl: pr.html_url,
    pullRequestNumber: pr.number,
    commitSha: file.commit.sha
  };
}
