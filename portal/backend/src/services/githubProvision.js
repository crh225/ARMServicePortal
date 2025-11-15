import { App as GitHubApp } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getBlueprintById } from "../config/blueprints.js";


function getConfig() {
  const {
    GITHUB_APP_ID,
    GITHUB_INSTALLATION_ID,
    GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_PRIVATE_KEY_BASE64,
    GITHUB_APP_PRIVATE_KEY_PATH,
    GITHUB_INFRA_OWNER,
    GITHUB_INFRA_REPO
  } = process.env;

  let resolvedPrivateKey = GITHUB_APP_PRIVATE_KEY;

  if (!resolvedPrivateKey && GITHUB_APP_PRIVATE_KEY_PATH) {
    try {
      const keyPath = path.isAbsolute(GITHUB_APP_PRIVATE_KEY_PATH)
        ? GITHUB_APP_PRIVATE_KEY_PATH
        : path.join(process.cwd(), GITHUB_APP_PRIVATE_KEY_PATH);

      resolvedPrivateKey = fs.readFileSync(keyPath, "utf8");
    } catch (err) {
      console.error(
        "[githubProvision] Failed to read key from GITHUB_APP_PRIVATE_KEY_PATH:",
        err
      );
    }
  }

  if (!resolvedPrivateKey && GITHUB_APP_PRIVATE_KEY_BASE64) {
    try {
      resolvedPrivateKey = Buffer.from(
        GITHUB_APP_PRIVATE_KEY_BASE64,
        "base64"
      ).toString("utf8");
    } catch (err) {
      console.error(
        "[githubProvision] Failed to decode GITHUB_APP_PRIVATE_KEY_BASE64:",
        err
      );
    }
  }

  return {
    appId: GITHUB_APP_ID,
    installationId: GITHUB_INSTALLATION_ID,
    privateKey: resolvedPrivateKey,
    infraOwner: GITHUB_INFRA_OWNER,
    infraRepo: GITHUB_INFRA_REPO
  };
}

async function getInstallationClient() {
  const { appId, installationId, privateKey } = getConfig();

  if (!appId || !installationId || !privateKey) {
    throw new Error(
      "GitHub App configuration missing. Check env vars: " +
        "GITHUB_APP_ID, GITHUB_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY / _PATH / _BASE64"
    );
  }

  const app = new GitHubApp({
    appId,
    privateKey
  });

  const {
    data: { token }
  } = await app.octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: installationId
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

  const { infraOwner, infraRepo } = getConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GITHUB_INFRA_OWNER and GITHUB_INFRA_REPO must be set");
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

  const lines = [
    `module "${moduleName}" {`,
    `  source       = "${blueprint.moduleSource}"`
  ];

  const allowedVarNames = (blueprint.variables || []).map((v) => v.name);

  for (const [k, v] of Object.entries(variables)) {
    if (!allowedVarNames.includes(k)) continue;
    const value = String(v).replace(/"/g, '\\"');
    lines.push(`  ${k} = "${value}"`);
  }

  lines.push("}");
  const tfContent = lines.join("\n");

  const filePath = `infra/environments/${environment}/requests/${moduleName}.tf`;

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
