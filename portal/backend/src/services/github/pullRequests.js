import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { parseBlueprintMetadataFromBody, mapStatusFromLabels } from "../../utils/githubParsers.js";
import { fetchTerraformOutputs } from "./terraform.js";
import { fileExists } from "./utils/gitOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../config/githubConstants.js";

// In-memory cache for module name to PR number mapping
// This prevents excessive GitHub API calls when looking up the same module multiple times
const modulePRCache = new Map();

// Cache for module-to-PR index (built from scanning all recent PRs once)
let moduleIndexCache = null;
let moduleIndexCacheTime = null;
const MODULE_INDEX_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate GitHub configuration
 */
function validateGitHubConfig() {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  return { infraOwner, infraRepo };
}

/**
 * Determine PR status from state and merge info
 */
function determinePRStatus(pr) {
  if (pr.state === "open") {
    return "open";
  } else if (pr.merged_at) {
    return "merged";
  } else if (pr.state === "closed") {
    return "closed";
  }
  return "unknown";
}

/**
 * Extract head reference from PR
 */
function getHeadRef(pr) {
  return pr.head && pr.head.ref ? pr.head.ref : "";
}

/**
 * Check if PR matches environment filter
 */
function matchesEnvironmentFilter(headRef, environment) {
  if (!headRef.startsWith("requests/")) {
    return false;
  }

  if (environment && !headRef.startsWith(`requests/${environment}/`)) {
    return false;
  }

  return true;
}

/**
 * Find Terraform file in PR files
 */
function findTerraformFile(files) {
  const tfFile = files.find(f => f.filename.endsWith(".tf"));
  return tfFile ? tfFile.filename : null;
}

/**
 * Extract module name from Terraform file path
 * e.g., "infra/environments/dev/azure-rg-basic_92b8015f.tf" -> "azure-rg-basic_92b8015f"
 */
function extractModuleName(filePath) {
  if (!filePath) return null;

  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.tf$/, "");
}

/**
 * Build basic job object from PR data
 */
function buildBasicJob(pr, environment) {
  const headRef = getHeadRef(pr);
  const { blueprintId, environment: envFromBody, createdBy } =
    parseBlueprintMetadataFromBody(pr.body || "");
  const { planStatus, applyStatus, labels } = mapStatusFromLabels(pr.labels || []);
  const status = determinePRStatus(pr);

  return {
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
  };
}

/**
 * Build detailed job object from PR data
 */
function buildDetailedJob(pr, metadata, terraformFilePath, moduleName, outputs, resourceExists) {
  const headRef = getHeadRef(pr);
  const { planStatus, applyStatus, labels } = mapStatusFromLabels(pr.labels || []);
  const status = determinePRStatus(pr);

  return {
    id: pr.number,
    number: pr.number,
    title: pr.title,
    description: pr.body || null,
    blueprintId: metadata.blueprintId || null,
    environment: metadata.environment || null,
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
    createdBy: metadata.createdBy || null,
    terraformModule: metadata.terraformModule || null,
    terraformFilePath,
    moduleName,
    resourceExists,
    outputs,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    changedFiles: pr.changed_files || 0
  };
}

/**
 * Check if resource file exists on base branch
 */
async function checkResourceExists(octokit, owner, repo, filePath, baseBranch, isMerged) {
  if (!isMerged || !filePath) {
    return false;
  }

  return await fileExists(octokit, {
    owner,
    repo,
    path: filePath,
    ref: baseBranch || DEFAULT_BASE_BRANCH
  });
}

/**
 * List all pull requests that match the "requests/" pattern
 */
export async function listGitHubRequests({ environment } = {}) {
  const { infraOwner, infraRepo } = validateGitHubConfig();
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
    const headRef = getHeadRef(pr);

    if (!matchesEnvironmentFilter(headRef, environment)) {
      continue;
    }

    jobs.push(buildBasicJob(pr, environment));
  }

  return jobs;
}

/**
 * Get detailed information for a specific pull request
 */
export async function getGitHubRequestByNumber(prNumber) {
  const { infraOwner, infraRepo } = validateGitHubConfig();
  const octokit = await getInstallationClient();

  // Get PR details
  const { data: pr } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  // Parse metadata
  const metadata = parseBlueprintMetadataFromBody(pr.body || "");

  // Get Terraform file path
  const { data: files } = await octokit.pulls.listFiles({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const terraformFilePath = findTerraformFile(files);
  const moduleName = extractModuleName(terraformFilePath);

  // Fetch Terraform outputs
  const outputs = await fetchTerraformOutputs({
    octokit,
    owner: infraOwner,
    repo: infraRepo,
    prNumber,
    moduleName
  });

  // Check if resource exists on base branch
  const resourceExists = await checkResourceExists(
    octokit,
    infraOwner,
    infraRepo,
    terraformFilePath,
    pr.base?.ref,
    Boolean(pr.merged_at)
  );

  return buildDetailedJob(pr, metadata, terraformFilePath, moduleName, outputs, resourceExists);
}

/**
 * Build an index of all module files to PR numbers
 * This scans recent PRs ONCE and builds a lookup table
 * Much more efficient than querying per-module
 */
async function buildModuleIndex(environment = 'dev') {
  const { infraOwner, infraRepo } = validateGitHubConfig();
  const octokit = await getInstallationClient();

  const index = new Map(); // filepath -> PR number

  try {
    // List recent PRs (limit to 100 to avoid excessive API usage)
    const { data: pulls } = await octokit.pulls.list({
      owner: infraOwner,
      repo: infraRepo,
      state: "all",
      per_page: 100,
      sort: "created",
      direction: "desc"
    });

    // For each PR, get its files and index them
    // Use Promise.all to fetch files in parallel (but this is still expensive)
    const filePromises = pulls.map(async (pr) => {
      try {
        const { data: files } = await octokit.pulls.listFiles({
          owner: infraOwner,
          repo: infraRepo,
          pull_number: pr.number
        });

        // Index .tf files in the environment directory
        files.forEach(file => {
          if (file.filename.startsWith(`infra/environments/${environment}/`) &&
              file.filename.endsWith('.tf')) {
            // Only store the FIRST (most recent) PR that modified this file
            if (!index.has(file.filename)) {
              index.set(file.filename, pr.number);
            }
          }
        });
      } catch (err) {
        console.error(`Failed to fetch files for PR #${pr.number}:`, err.message);
      }
    });

    await Promise.all(filePromises);

    console.log(`Built module index with ${index.size} module files from ${pulls.length} PRs`);
    return index;
  } catch (error) {
    console.error('Failed to build module index:', error.message);
    return new Map();
  }
}

/**
 * Find PR that created a specific module/stack by looking for the .tf file
 * This is used for stack components where the request-id is the module name, not a PR number
 * Uses a cached index to minimize GitHub API calls
 */
export async function findPRByModuleName(moduleName, environment = 'dev') {
  const cacheKey = `${environment}:${moduleName}`;

  // Check individual cache first
  if (modulePRCache.has(cacheKey)) {
    const cachedPRNumber = modulePRCache.get(cacheKey);
    if (cachedPRNumber === null) {
      return null; // Previously failed to find PR
    }
    return getGitHubRequestByNumber(cachedPRNumber);
  }

  // Build or refresh module index if needed
  const now = Date.now();
  if (!moduleIndexCache || !moduleIndexCacheTime || (now - moduleIndexCacheTime > MODULE_INDEX_TTL)) {
    moduleIndexCache = await buildModuleIndex(environment);
    moduleIndexCacheTime = now;
  }

  // Look up in the index
  const expectedFilePath = `infra/environments/${environment}/${moduleName}.tf`;
  const prNumber = moduleIndexCache.get(expectedFilePath);

  if (prNumber) {
    // Cache and return
    modulePRCache.set(cacheKey, prNumber);
    return getGitHubRequestByNumber(prNumber);
  }

  // Not found - cache negative result
  modulePRCache.set(cacheKey, null);
  return null;
}
