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

function mapStatusFromLabels(labels) {
  const names = (labels || []).map((l) => l.name);

  let planStatus = "unknown";
  if (names.includes("status:plan-ok")) planStatus = "ok";
  if (names.includes("status:plan-failed")) planStatus = "failed";

  let applyStatus = "unknown";
  if (names.includes("status:apply-ok")) applyStatus = "ok";
  if (names.includes("status:apply-failed")) applyStatus = "failed";

  return { planStatus, applyStatus, labels: names };
}

function parseBlueprintMetadataFromBody(body) {
  if (!body) {
    return { blueprintId: null, environment: null };
  }

  let blueprintId = null;
  let environment = null;

  const blueprintMatch = body.match(/Blueprint:\s*`([^`]+)`/i);
  if (blueprintMatch && blueprintMatch[1]) {
    blueprintId = blueprintMatch[1].trim();
  }

  const envMatch = body.match(/Environment:\s*`([^`]+)`/i);
  if (envMatch && envMatch[1]) {
    environment = envMatch[1].trim();
  }

  return { blueprintId, environment };
}

export async function listGitHubRequests({ environment } = {}) {
  const { infraOwner, infraRepo } = getConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GITHUB_INFRA_OWNER and GITHUB_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // Get recent PRs
  const { data: pulls } = await octokit.pulls.list({
    owner: infraOwner,
    repo: infraRepo,
    state: "all",
    per_page: 50,
    sort: "created",
    direction: "desc"
  });

  const jobs = [];

  for (const pr of pulls) {
    const headRef = pr.head && pr.head.ref ? pr.head.ref : "";

    // Only consider request branches created by this portal
    if (!headRef.startsWith("requests/")) continue;

    // Optional environment filter like requests/dev/...
    if (environment && !headRef.startsWith(`requests/${environment}/`)) {
      continue;
    }

    const { blueprintId, environment: envFromBody } = parseBlueprintMetadataFromBody(
      pr.body || ""
    );

    const { planStatus, applyStatus, labels } = mapStatusFromLabels(pr.labels || []);

    let status = "unknown";
    if (pr.state === "open") {
      status = "open";
    } else if (pr.merged_at) {
      status = "merged";
    } else if (pr.state === "closed") {
      status = "closed";
    }

    jobs.push({
      id: pr.number,
      number: pr.number,
      title: pr.title,
      blueprintId: blueprintId || null,
      environment: environment || envFromBody || null,
      status,
      labels,
      planStatus,
      applyStatus,
      state: pr.state,
      merged: Boolean(pr.merged_at),
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      pullRequestUrl: pr.html_url,
      headRef
    });
  }

  return jobs;
}

export async function getGitHubRequestByNumber(prNumber) {
  const { infraOwner, infraRepo } = getConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GITHUB_INFRA_OWNER and GITHUB_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  const { data: pr } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const headRef = pr.head && pr.head.ref ? pr.head.ref : "";
  const { blueprintId, environment } = parseBlueprintMetadataFromBody(pr.body || "");
  const { planStatus, applyStatus, labels } = mapStatusFromLabels(pr.labels || []);

  let status = "unknown";
  if (pr.state === "open") {
    status = "open";
  } else if (pr.merged_at) {
    status = "merged";
  } else if (pr.state === "closed") {
    status = "closed";
  }


  let outputs = null;
  try {
    const { data: comments } = await octokit.issues.listComments({
      owner: infraOwner,
      repo: infraRepo,
      issue_number: prNumber,
      per_page: 50
    });

    const tfComment = [...comments]
      .reverse()
      .find(
        (c) =>
          typeof c.body === "string" && c.body.startsWith("TF_OUTPUTS:")
      );

    if (tfComment) {
      const match = tfComment.body.match(/```json([\s\S]*?)```/);
      if (match && match[1]) {
        outputs = JSON.parse(match[1]);
      }
    }
  } catch (e) {
    console.warn("Failed to parse TF outputs comment", e.message);
  }

  return {
    id: pr.number,
    number: pr.number,
    title: pr.title,
    blueprintId: blueprintId || null,
    environment: environment || null,
    status,
    labels,
    planStatus,
    applyStatus,
    state: pr.state,
    merged: Boolean(pr.merged_at),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    pullRequestUrl: pr.html_url,
    headRef,
    outputs   // <-- new field
  };
}

