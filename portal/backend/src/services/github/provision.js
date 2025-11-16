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
 */
export async function createGitHubRequest({ environment, blueprintId, variables }) {
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
  const branchName = `requests/${environment}/${safeBlueprint}-${shortId}`;

  await octokit.git.createRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  // 3) Render module block as a .tf file
  const moduleName = `${safeBlueprint}_${shortId}`;
  const tfContent = renderTerraformModule({
    moduleName,
    blueprint,
    variables
  });

  const filePath = `infra/environments/${environment}/${moduleName}.tf`;

  // 4) Create file in the branch
  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: `chore: request ${blueprintId} in ${environment} (${shortId})`,
    content: Buffer.from(tfContent, "utf8").toString("base64"),
    branch: branchName
  });

  // 5) Open a PR
  const title = `Provision ${blueprint.displayName} in ${environment} (${shortId})`;
  const body = [
    `Blueprint: \`${blueprintId}\``,
    `Environment: \`${environment}\``,
    "",
    "Rendered module:",
    "```hcl",
    tfContent,
    "```"
  ].join("\n");

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
