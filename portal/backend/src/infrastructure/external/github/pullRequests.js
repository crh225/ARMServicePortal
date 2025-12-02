import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { parseBlueprintMetadataFromBody, mapStatusFromLabels } from "../../../domain/services/GitHubParser.js";
import { fetchTerraformOutputs } from "./terraform.js";
import { fileExists } from "./utils/gitOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../../config/githubConstants.js";
import { cache } from "../../utils/Cache.js";
import { Result } from "../../../domain/common/Result.js";

// Cache TTL: 10 minutes for PR data
const PR_CACHE_TTL = 10 * 60 * 1000;
// Cache TTL: 10 minutes for job count (used by home stats)
const JOB_COUNT_CACHE_TTL = 10 * 60 * 1000;

// In-memory cache for module name to PR number mapping
// This prevents excessive GitHub API calls when looking up the same module multiple times
const modulePRCache = new Map();

// Cache for module-to-PR index (built from scanning all recent PRs once)
let moduleIndexCache = null;
let moduleIndexCacheTime = null;
const MODULE_INDEX_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate GitHub configuration
 * @returns {Result<{infraOwner: string, infraRepo: string}>} Result with config or error
 */
function validateGitHubConfig() {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    return Result.failure("GH_INFRA_OWNER and GH_INFRA_REPO environment variables must be set");
  }

  return Result.success({ infraOwner, infraRepo });
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
 * Find Crossplane claim file in PR files
 */
function findCrossplaneFile(files) {
  const claimFile = files.find(f =>
    f.filename.includes("crossplane/claims/") && f.filename.endsWith(".yaml")
  );
  return claimFile ? claimFile.filename : null;
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
 * Detect provider from blueprint ID or branch name (fallback for older PRs without provider metadata)
 */
function detectProvider(blueprintId, headRef, explicitProvider) {
  // If explicitly set in PR body, use that
  if (explicitProvider) return explicitProvider;

  // Check blueprint ID prefix (xp- = crossplane)
  if (blueprintId && blueprintId.startsWith("xp-")) return "crossplane";

  // Check if branch points to crossplane claims directory
  if (headRef && headRef.includes("crossplane")) return "crossplane";

  // Default to terraform
  return "terraform";
}

/**
 * Build basic job object from PR data
 */
function buildBasicJob(pr, environment) {
  const headRef = getHeadRef(pr);
  const { blueprintId, environment: envFromBody, provider, createdBy } =
    parseBlueprintMetadataFromBody(pr.body || "");
  const { planStatus, applyStatus, labels } = mapStatusFromLabels(pr.labels || []);
  const status = determinePRStatus(pr);

  return {
    id: pr.number,
    number: pr.number,
    title: pr.title,
    blueprintId: blueprintId || null,
    environment: environment || envFromBody || null,
    provider: detectProvider(blueprintId, headRef, provider),
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
    provider: detectProvider(metadata.blueprintId, headRef, metadata.provider),
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
    crossplaneYaml: metadata.crossplaneYaml || null,
    crossplaneResourceName: metadata.crossplaneResourceName || null,
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
 * Get count of pull requests matching the "requests/" pattern using GitHub Search API
 * Much faster than listGitHubRequests() - single API call instead of pagination
 * @returns {Promise<Result>} Result containing count number or error
 */
export async function getGitHubRequestsCount({ environment } = {}) {
  const cacheKey = environment ? `jobs:count:${environment}` : "jobs:count:all";

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    console.log(`[Cache HIT] Job count: ${cached}`);
    return Result.success(cached);
  }

  const configResult = validateGitHubConfig();
  if (configResult.isFailure) {
    return configResult;
  }
  const { infraOwner, infraRepo } = configResult.value;
  const octokit = await getInstallationClient();

  try {
    // Use Search API - returns total_count in a single call
    // Search for PRs with branch names starting with "requests/"
    const branchPattern = environment
      ? `requests/${environment}/`
      : "requests/";

    const { data } = await octokit.search.issuesAndPullRequests({
      q: `repo:${infraOwner}/${infraRepo} is:pr head:${branchPattern}`,
      per_page: 1 // We only need the count, not the actual PRs
    });

    const count = data.total_count;

    // Cache the count
    await cache.set(cacheKey, count, JOB_COUNT_CACHE_TTL);
    console.log(`[Cache STORED] Job count: ${count}`);

    return Result.success(count);
  } catch (error) {
    console.error("[GitHub] Failed to get job count:", error.message);
    // Fallback to full list if search fails (some GitHub instances don't support search)
    const listResult = await listGitHubRequests({ environment });
    if (listResult.isSuccess) {
      return Result.success(listResult.value.length);
    }
    return Result.failure(error.message);
  }
}

/**
 * List all pull requests that match the "requests/" pattern
 * @returns {Promise<Result>} Result containing jobs array or error
 */
export async function listGitHubRequests({ environment } = {}) {
  const configResult = validateGitHubConfig();
  if (configResult.isFailure) {
    return configResult;
  }
  const { infraOwner, infraRepo } = configResult.value;
  const octokit = await getInstallationClient();

  // Fetch all PRs using pagination (GitHub max is 100 per page)
  const pulls = await octokit.paginate(octokit.pulls.list, {
    owner: infraOwner,
    repo: infraRepo,
    state: "all",
    per_page: 100,
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

  return Result.success(jobs);
}

/**
 * Get detailed information for a specific pull request (with caching)
 * @returns {Promise<Result>} Result containing PR data or error
 */
export async function getGitHubRequestByNumber(prNumber) {
  const cacheKey = `pr:details:${prNumber}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Using cached PR data for #${prNumber}`);
    return Result.success(cached);
  }

  console.log(`[Cache MISS] Fetching fresh PR data for #${prNumber}`);

  const configResult = validateGitHubConfig();
  if (configResult.isFailure) {
    return configResult;
  }
  const { infraOwner, infraRepo } = configResult.value;
  const octokit = await getInstallationClient();

  // Get PR details
  const { data: pr } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  // Parse metadata
  const metadata = parseBlueprintMetadataFromBody(pr.body || "");

  // Get file paths from PR
  const { data: files } = await octokit.pulls.listFiles({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const terraformFilePath = findTerraformFile(files);
  const crossplaneFilePath = findCrossplaneFile(files);
  const moduleName = extractModuleName(terraformFilePath);

  // Fetch Terraform outputs (only for Terraform PRs)
  const outputs = await fetchTerraformOutputs({
    octokit,
    owner: infraOwner,
    repo: infraRepo,
    prNumber,
    moduleName
  });

  // Check if resource exists on base branch (works for both Terraform and Crossplane)
  const resourceFilePath = terraformFilePath || crossplaneFilePath;
  const resourceExists = await checkResourceExists(
    octokit,
    infraOwner,
    infraRepo,
    resourceFilePath,
    pr.base?.ref,
    Boolean(pr.merged_at)
  );

  const prData = buildDetailedJob(pr, metadata, terraformFilePath, moduleName, outputs, resourceExists);

  // Cache the result for 1 hour
  await cache.set(cacheKey, prData, PR_CACHE_TTL);
  console.log(`[Cache STORED] Cached PR #${prNumber} (TTL: 1hr)`);

  return Result.success(prData);
}

/**
 * Build an index of module names to PR numbers
 * This parses PR branch names to extract module names (very efficient - just 1 API call!)
 * @returns {Promise<Map>} Map of file paths to PR numbers
 */
async function buildModuleIndex(environment = 'dev') {
  const configResult = validateGitHubConfig();
  if (configResult.isFailure) {
    console.error('Failed to build module index:', configResult.error.message);
    return new Map();
  }
  const { infraOwner, infraRepo } = configResult.value;
  const octokit = await getInstallationClient();

  const index = new Map(); // filepath -> PR number

  try {
    // List recent PRs (1 API call total!)
    // Parse branch names to extract module names
    const { data: pulls } = await octokit.pulls.list({
      owner: infraOwner,
      repo: infraRepo,
      state: "all",
      per_page: 100,
      sort: "updated",  // Most recently updated first
      direction: "desc"
    });

    // Extract module names from PR branch names
    // Branch format: requests/{env}/{blueprint}_{shortId} or requests/{env}/{moduleName}-update-{shortId}
    pulls.forEach(pr => {
      const headRef = pr.head && pr.head.ref ? pr.head.ref : "";

      if (headRef.startsWith(`requests/${environment}/`)) {
        // Extract the module part from the branch name
        const branchSuffix = headRef.replace(`requests/${environment}/`, '');

        // For new provisions: blueprint_shortId
        // For updates: moduleName-update-shortId
        let moduleName;
        if (branchSuffix.includes('-update-')) {
          moduleName = branchSuffix.split('-update-')[0];
        } else {
          // For new provisions, the module name IS the branch suffix (blueprint_shortId)
          moduleName = branchSuffix;
        }

        const expectedFilePath = `infra/environments/${environment}/${moduleName}.tf`;

        // Only store the FIRST (most recent) PR for this file
        if (!index.has(expectedFilePath)) {
          index.set(expectedFilePath, pr.number);
        }
      }
    });

    console.log(`Built module index with ${index.size} modules from ${pulls.length} PRs (1 API call)`);
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
 * @returns {Promise<Result|null>} Result containing PR data, null if not found, or error
 */
export async function findPRByModuleName(moduleName, environment = 'dev') {
  const cacheKey = `${environment}:${moduleName}`;

  // Check individual cache first
  if (modulePRCache.has(cacheKey)) {
    const cachedPRNumber = modulePRCache.get(cacheKey);
    if (cachedPRNumber === null) {
      return Result.notFound(`PR not found for module: ${moduleName}`);
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
  return Result.notFound(`PR not found for module: ${moduleName}`);
}
