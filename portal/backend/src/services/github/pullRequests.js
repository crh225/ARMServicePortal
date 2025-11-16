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

    const { blueprintId, environment: envFromBody } =
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
      headRef
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
  const { blueprintId, environment, terraformModule } = parseBlueprintMetadataFromBody(
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

  const outputs = await fetchTerraformOutputs({
    octokit,
    owner: infraOwner,
    repo: infraRepo,
    prNumber
  });

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
    terraformModule: terraformModule || null,
    outputs,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    changedFiles: pr.changed_files || 0
  };
}
