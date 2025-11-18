import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { parseBlueprintMetadataFromBody, mapStatusFromLabels } from "../../utils/githubParsers.js";
import { fetchTerraformOutputs } from "./terraform.js";

/**
 * List all pull requests that match the "requests/" pattern
 */
export async function listGitHubRequests({ environment } = {}) {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

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

    if (!headRef.startsWith("requests/")) continue;

    if (environment && !headRef.startsWith(`requests/${environment}/`)) {
      continue;
    }

    const { blueprintId, environment: envFromBody, createdBy } =
      parseBlueprintMetadataFromBody(pr.body || "");

    const { planStatus, applyStatus, labels } = mapStatusFromLabels(
      pr.labels || []
    );

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
      headRef,
      createdBy: createdBy || null
    });
  }

  return jobs;
}

/**
 * Get detailed information for a specific pull request
 */
export async function getGitHubRequestByNumber(prNumber) {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  const { data: pr } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const headRef = pr.head && pr.head.ref ? pr.head.ref : "";
  const { blueprintId, environment, terraformModule, createdBy } = parseBlueprintMetadataFromBody(
    pr.body || ""
  );
  const { planStatus, applyStatus, labels } = mapStatusFromLabels(
    pr.labels || []
  );

  let status = "unknown";
  if (pr.state === "open") {
    status = "open";
  } else if (pr.merged_at) {
    status = "merged";
  } else if (pr.state === "closed") {
    status = "closed";
  }

  // Get the Terraform file path from PR files first (to extract module name)
  const { data: files } = await octokit.pulls.listFiles({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const tfFile = files.find(f => f.filename.endsWith(".tf"));
  const terraformFilePath = tfFile ? tfFile.filename : null;

  // Extract module name from file path (e.g., "infra/environments/dev/azure-rg-basic_92b8015f.tf" -> "azure-rg-basic_92b8015f")
  let moduleName = null;
  if (terraformFilePath) {
    const parts = terraformFilePath.split("/");
    const fileName = parts[parts.length - 1];
    moduleName = fileName.replace(/\.tf$/, "");
  }

  // Fetch outputs filtered to this specific module
  const outputs = await fetchTerraformOutputs({
    octokit,
    owner: infraOwner,
    repo: infraRepo,
    prNumber,
    moduleName
  });

  // Check if the Terraform file still exists on the base branch (for deployed resources)
  let resourceExists = false;
  if (pr.merged_at && terraformFilePath) {
    try {
      await octokit.repos.getContent({
        owner: infraOwner,
        repo: infraRepo,
        path: terraformFilePath,
        ref: pr.base?.ref || "main"
      });
      resourceExists = true;
    } catch (err) {
      // File doesn't exist (404) or other error
      resourceExists = false;
    }
  }

  return {
    id: pr.number,
    number: pr.number,
    title: pr.title,
    description: pr.body || null,
    blueprintId: blueprintId || null,
    environment: environment || null,
    status,
    labels,
    planStatus,
    applyStatus,
    state: pr.state,
    merged: Boolean(pr.merged_at),
    mergedAt: pr.merged_at || null,
    closedAt: pr.closed_at || null,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    pullRequestUrl: pr.html_url,
    headRef,
    baseBranch: pr.base?.ref || null,
    author: pr.user?.login || null,
    createdBy: createdBy || null,
    terraformModule: terraformModule || null,
    terraformFilePath: terraformFilePath,
    moduleName: moduleName,
    resourceExists: resourceExists,
    outputs,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    changedFiles: pr.changed_files || 0
  };
}
