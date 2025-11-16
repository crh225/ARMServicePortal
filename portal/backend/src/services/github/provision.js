import crypto from "crypto";
import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { getBlueprintById } from "../../config/blueprints.js";
import { renderTerraformModule } from "../../utils/terraformRenderer.js";

/**
 * Creates a branch + Terraform module file + PR in the infrastructure repo
 *
 * It writes a .tf file under:
 *   infra/environments/{environment}/{moduleName}.tf
 *
 * @param {string} environment - The target environment
 * @param {string} blueprintId - The blueprint ID
 * @param {object} variables - The Terraform variables
 * @param {string} [moduleName] - Optional module name (for updates). If not provided, generates a new one.
 */
export async function createGitHubRequest({ environment, blueprintId, variables, moduleName: providedModuleName }) {
  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown blueprintId: ${blueprintId}`);
  }

  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // 1) Get default branch SHA
  const { data: repo } = await octokit.repos.get({
    owner: infraOwner,
    repo: infraRepo
  });

  const baseBranch = repo.default_branch || "main";

  const { data: baseRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  const baseSha = baseRef.object.sha;

  // 2) Create a new branch
  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");

  // Use provided module name (for updates) or generate a new one
  const moduleName = providedModuleName || `${safeBlueprint}_${shortId}`;
  const isUpdate = Boolean(providedModuleName);

  const branchName = isUpdate
    ? `requests/${environment}/${moduleName}-update-${shortId}`
    : `requests/${environment}/${safeBlueprint}-${shortId}`;

  await octokit.git.createRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  // 3) Render module block as a .tf file
  const tfContent = renderTerraformModule({
    moduleName,
    blueprint,
    variables
  });

  const filePath = `infra/environments/${environment}/${moduleName}.tf`;

  // 4) Create or update file in the branch
  let commitMessage;
  let fileSha = null;

  if (isUpdate) {
    // For updates, get the existing file SHA from the base branch
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: infraOwner,
        repo: infraRepo,
        path: filePath,
        ref: baseBranch
      });
      fileSha = existingFile.sha;
      commitMessage = `chore: update ${blueprintId} in ${environment} (${moduleName})`;
    } catch (err) {
      if (err.status === 404) {
        // File doesn't exist on base branch, treat as new provision
        commitMessage = `chore: request ${blueprintId} in ${environment} (${shortId})`;
      } else {
        throw err;
      }
    }
  } else {
    commitMessage = `chore: request ${blueprintId} in ${environment} (${shortId})`;
  }

  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(tfContent, "utf8").toString("base64"),
    branch: branchName,
    ...(fileSha && { sha: fileSha })
  });

  // 5) Open a PR
  const title = isUpdate
    ? `Update ${blueprint.displayName} in ${environment} (${moduleName})`
    : `Provision ${blueprint.displayName} in ${environment} (${shortId})`;

  const body = [
    `Blueprint: \`${blueprintId}\``,
    `Environment: \`${environment}\``,
    isUpdate ? `**Update**: Modifying existing resource \`${moduleName}\`` : "",
    "",
    "Rendered module:",
    "```hcl",
    tfContent,
    "```"
  ].filter(Boolean).join("\n");

  const { data: pr } = await octokit.pulls.create({
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
