import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { parseBlueprintMetadataFromBody, mapStatusFromLabels } from "../../../domain/services/GitHubParser.js";
import { fetchTerraformOutputs } from "./terraform.js";
import { fileExists } from "./utils/gitOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../../config/githubConstants.js";
import { cache } from "../../utils/Cache.js";

// Cache TTL: 1 hour for PR data
const PR_CACHE_TTL = 60 * 60 * 1000;

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
 * List all pull requests that match the "requests/" pattern
 */
export async function listGitHubRequests({ environment } = {}) {
  const { infraOwner, infraRepo } = validateGitHubConfig();
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

  return jobs;
}

/**
 * Get detailed information for a specific pull request (with caching)
 */
export async function getGitHubRequestByNumber(prNumber) {
  const cacheKey = `pr:details:${prNumber}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Using cached PR data for #${prNumber}`);
    return cached;
  }

  console.log(`[Cache MISS] Fetching fresh PR data for #${prNumber}`);

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

  const prData = buildDetailedJob(pr, metadata, terraformFilePath, moduleName, outputs, resourceExists);

  // Cache the result for 1 hour
  cache.set(cacheKey, prData, PR_CACHE_TTL);
  console.log(`[Cache STORED] Cached PR #${prNumber} (TTL: 1hr)`);

  return prData;
}

/**
 * Build an index of module names to PR numbers
 * This parses PR branch names to extract module names (very efficient - just 1 API call!)
 */
async function buildModuleIndex(environment = 'dev') {
  const { infraOwner, infraRepo } = validateGitHubConfig();
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
