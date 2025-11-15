import { App as GitHubApp } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { getBlueprintById } from "../config/blueprints.js";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;

const GITHUB_APP_PRIVATE_KEY =
  process.env.GITHUB_APP_PRIVATE_KEY ||
  (process.env.GITHUB_APP_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY_BASE64, "base64").toString("utf8")
    : undefined);

const INFRA_OWNER = process.env.GITHUB_INFRA_OWNER; 
const INFRA_REPO = process.env.GITHUB_INFRA_REPO;

if (!GITHUB_APP_ID || !GITHUB_INSTALLATION_ID || !GITHUB_APP_PRIVATE_KEY) {
  console.warn("[githubProvision] GitHub App env vars are not fully set. Provisioning will fail until configured.");
}

async function getInstallationClient() {
  const app = new GitHubApp({
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY
  });

  const { data: { token } } = await app.octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: GITHUB_INSTALLATION_ID
    }
  );

  return new Octokit({ auth: token });
}

/**
 * Creates a branch + Terraform module file + PR in *this* repo.
 *
 * It writes a .tf file under:
 *   infra/environments/{environment}/requests/{moduleName}.tf
 */
export async function createGitHubRequest({ environment, blueprintId, variables }) {
  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown blueprintId: ${blueprintId}`);
  }
  if (!INFRA_OWNER || !INFRA_REPO) {
    throw new Error("GITHUB_INFRA_OWNER and GITHUB_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // 1) Get default branch SHA
  const { data: repo } = await octokit.repos.get({
    owner: INFRA_OWNER,
    repo: INFRA_REPO
  });

  const baseBranch = repo.default_branch || "main";

  const { data: baseRef } = await octokit.git.getRef({
    owner: INFRA_OWNER,
    repo: INFRA_REPO,
    ref: `heads/${baseBranch}`
  });

  const baseSha = baseRef.object.sha;

  // 2) Create a new branch
  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const branchName = `requests/${environment}/${safeBlueprint}-${shortId}`;

  await octokit.git.createRef({
    owner: INFRA_OWNER,
    repo: INFRA_REPO,
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  // 3) Render module block as a .tf file
  const moduleName = `${safeBlueprint}_${shortId}`;

  const lines = [
    `module "${moduleName}" {`,
    `  source       = "${blueprint.moduleSource}"`
  ];

  const allowedVarNames = (blueprint.variables || []).map((v) => v.name);

  for (const [k, v] of Object.entries(variables)) {
    if (!allowedVarNames.includes(k)) continue;
    const value = String(v).replace(/"/g, '\"');
    lines.push(`  ${k} = "${value}"`);
  }

  lines.push("}");
  const tfContent = lines.join("\n");

  const filePath = `infra/environments/${environment}/requests/${moduleName}.tf`;

  // 4) Create file in the branch
  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: INFRA_OWNER,
    repo: INFRA_REPO,
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
    owner: INFRA_OWNER,
    repo: INFRA_REPO,
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
