import crypto from "crypto";
import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { getBlueprintById } from "../../../config/blueprints.js";
import { renderTerraformModule } from "../../utils/TerraformRenderer.js";
import { isStack, renderStackTerraform } from "../../utils/StackRenderer.js";
import {
  isCrossplane,
  isBuildingBlocks,
  renderCrossplaneClaim,
  renderBuildingBlocksClaims,
  getCrossplaneFilePath
} from "../../utils/CrossplaneRenderer.js";
import { ensureBranch, commitFile, getFileContent } from "./utils/gitOperations.js";
import { createPR, generatePRBody } from "./utils/prOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../../config/githubConstants.js";
import { Result } from "../../../domain/common/Result.js";

/**
 * Generate a unique branch name for provision request
 */
function generateBranchName(environment, blueprintId, moduleName, isUpdate) {
  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (isUpdate) {
    return `requests/${environment}/${moduleName}-update-${shortId}`;
  }
  return `requests/${environment}/${safeBlueprint}-${shortId}`;
}

/**
 * Generate module name (either provided or new)
 */
function getModuleName(blueprintId, providedModuleName) {
  if (providedModuleName) {
    return { moduleName: providedModuleName, isUpdate: true, shortId: null };
  }

  const shortId = crypto.randomBytes(4).toString("hex");
  const safeBlueprint = blueprintId.replace(/[^a-zA-Z0-9_-]/g, "-");
  // Use hyphen for K8s compatibility (Crossplane claims can't have underscores)
  const moduleName = `${safeBlueprint}-${shortId}`;

  return { moduleName, isUpdate: false, shortId };
}

/**
 * Get file SHA if updating existing file
 */
async function getExistingFileSha(octokit, owner, repo, filePath, baseBranch) {
  try {
    const fileData = await getFileContent(octokit, {
      owner,
      repo,
      path: filePath,
      ref: baseBranch
    });
    return fileData.sha;
  } catch (err) {
    if (err.status === 404) {
      return null; // File doesn't exist
    }
    throw err;
  }
}

/**
 * Creates a branch + Terraform module file + PR in the infrastructure repo
 *
 * It writes a .tf file under:
 *   infra/environments/{environment}/{moduleName}.tf
 *
 * @param {string} environment - The target environment
 * @param {string} blueprintId - The blueprint ID
 * @param {string} [blueprintVersion] - Optional blueprint version
 * @param {object} variables - The Terraform variables
 * @param {string} [moduleName] - Optional module name (for updates). If not provided, generates a new one.
 * @param {string} [createdBy] - GitHub username of the user who created this request
 */
export async function createGitHubRequest({ environment, blueprintId, blueprintVersion, variables, moduleName: providedModuleName, createdBy }) {
  const blueprint = getBlueprintById(blueprintId, blueprintVersion);
  if (!blueprint) {
    return Result.notFound(`Unknown blueprintId: ${blueprintId}${blueprintVersion ? `@${blueprintVersion}` : ''}`);
  }

  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    return Result.failure("GH_INFRA_OWNER and GH_INFRA_REPO environment variables must be set");
  }

  const octokit = await getInstallationClient();

  // Get default branch SHA
  const { data: repo } = await octokit.repos.get({
    owner: infraOwner,
    repo: infraRepo
  });

  const baseBranch = repo.default_branch || DEFAULT_BASE_BRANCH;

  const { data: baseRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  const baseSha = baseRef.object.sha;

  // Determine module/claim name and whether this is an update
  const { moduleName, isUpdate, shortId } = getModuleName(blueprintId, providedModuleName);

  // Create branch
  const branchName = generateBranchName(environment, blueprintId, moduleName, isUpdate);

  await ensureBranch(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    branchName,
    baseSha
  });

  // Route to Crossplane or Terraform rendering based on provider
  try {
    let result;
    if (isCrossplane(blueprint)) {
      result = await createCrossplaneRequest({
        octokit,
        infraOwner,
        infraRepo,
        baseBranch,
        branchName,
        blueprint,
        variables,
        moduleName,
        shortId,
        isUpdate,
        environment,
        createdBy
      });
    } else {
      // Terraform path (existing logic)
      result = await createTerraformRequest({
        octokit,
        infraOwner,
        infraRepo,
        baseBranch,
        branchName,
        blueprint,
        variables,
        moduleName,
        shortId,
        isUpdate,
        environment,
        createdBy
      });
    }
    return Result.success(result);
  } catch (error) {
    return Result.failure(error);
  }
}

/**
 * Create a Crossplane claim PR
 */
async function createCrossplaneRequest({
  octokit,
  infraOwner,
  infraRepo,
  baseBranch,
  branchName,
  blueprint,
  variables,
  moduleName,
  shortId,
  isUpdate,
  environment,
  createdBy
}) {
  // Check if this is building blocks mode
  if (isBuildingBlocks(blueprint)) {
    return createBuildingBlocksRequest({
      octokit,
      infraOwner,
      infraRepo,
      baseBranch,
      branchName,
      blueprint,
      variables,
      shortId,
      isUpdate,
      environment,
      createdBy
    });
  }

  // Single claim mode (legacy)
  // For Crossplane, the claim name is derived from appName + environment if available
  const claimName = variables.appName && variables.environment
    ? `${variables.appName}-${variables.environment}`
    : moduleName;

  // Render Crossplane claim YAML
  let yamlContent = renderCrossplaneClaim({
    claimName,
    blueprint,
    variables,
    prNumber: moduleName, // Temporary, will update with actual PR number
    createdBy
  });

  const filePath = getCrossplaneFilePath(environment, claimName);

  // Get existing file SHA if updating
  const fileSha = isUpdate
    ? await getExistingFileSha(octokit, infraOwner, infraRepo, filePath, baseBranch)
    : null;

  // Commit file
  const commitMessage = isUpdate
    ? `chore: update ${blueprint.id} claim in ${environment} (${claimName})`
    : `chore: request ${blueprint.id} claim in ${environment} (${shortId})`;

  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(yamlContent, "utf8").toString("base64"),
    branch: branchName,
    ...(fileSha && { sha: fileSha })
  });

  // Create PR
  const title = isUpdate
    ? `Update ${blueprint.displayName} in ${environment} (${claimName})`
    : `Provision ${blueprint.displayName} in ${environment} (${shortId})`;

  const description = [
    isUpdate ? `**Update**: Modifying existing Crossplane claim \`${claimName}\`` : "",
    "",
    `**Provider**: Crossplane`,
    `**Kind**: ${blueprint.crossplane.kind}`,
    "",
    "Rendered claim:",
    "```yaml",
    yamlContent,
    "```"
  ].filter(Boolean).join("\n");

  const body = generatePRBody({
    blueprintId: blueprint.id,
    environment,
    createdBy,
    terraformModule: claimName, // Reuse field for claim name
    version: blueprint.version,
    provider: "crossplane"
  }, description);

  const pr = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title,
    head: branchName,
    base: baseBranch,
    body
  });

  // Update YAML with actual PR number
  yamlContent = renderCrossplaneClaim({
    claimName,
    blueprint,
    variables,
    prNumber: pr.number,
    createdBy
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: `chore: update request-id label with PR number #${pr.number}`,
    content: Buffer.from(yamlContent, "utf8").toString("base64"),
    branch: branchName,
    sha: file.content.sha
  });

  return {
    branchName,
    filePath,
    pullRequestUrl: pr.html_url,
    pullRequestNumber: pr.number,
    commitSha: file.commit.sha,
    provider: "crossplane",
    claimName
  };
}

/**
 * Create a building blocks PR with multiple claims
 */
async function createBuildingBlocksRequest({
  octokit,
  infraOwner,
  infraRepo,
  baseBranch,
  branchName,
  blueprint,
  variables,
  shortId,
  isUpdate,
  environment,
  createdBy
}) {
  const appName = variables.appName;
  const appEnvironment = variables.environment || "dev";
  const claimName = `${appName}-${appEnvironment}`;

  // Render all claims as multi-document YAML
  let yamlContent = renderBuildingBlocksClaims({
    blueprint,
    variables,
    prNumber: shortId, // Temporary, will update with actual PR number
    createdBy
  });

  // Building blocks go into a single file per app
  const filePath = getCrossplaneFilePath(environment, claimName);

  // Get existing file SHA if updating
  const fileSha = isUpdate
    ? await getExistingFileSha(octokit, infraOwner, infraRepo, filePath, baseBranch)
    : null;

  // Determine which components are enabled for the commit message
  const enabledComponents = [];
  if (variables.postgres_enabled) enabledComponents.push("PostgreSQL");
  if (variables.redis_enabled) enabledComponents.push("Redis");
  if (variables.rabbitmq_enabled) enabledComponents.push("RabbitMQ");
  if (variables.backend_enabled) enabledComponents.push("Backend");
  if (variables.frontend_enabled) enabledComponents.push("Frontend");
  if (variables.ingress_enabled) enabledComponents.push("Ingress");

  const componentsStr = enabledComponents.join(", ") || "empty stack";

  // Commit file
  const commitMessage = isUpdate
    ? `chore: update ${appName} building blocks in ${environment}`
    : `chore: provision ${appName} building blocks in ${environment} (${shortId})`;

  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(yamlContent, "utf8").toString("base64"),
    branch: branchName,
    ...(fileSha && { sha: fileSha })
  });

  // Create PR
  const title = isUpdate
    ? `Update ${appName} in ${environment}`
    : `Provision ${appName} in ${environment} (${shortId})`;

  const description = [
    `**Application**: ${appName}`,
    `**Environment**: ${appEnvironment}`,
    `**Provider**: Crossplane Building Blocks`,
    "",
    `**Components**: ${componentsStr}`,
    "",
    "Rendered claims:",
    "```yaml",
    yamlContent,
    "```"
  ].join("\n");

  const body = generatePRBody({
    blueprintId: blueprint.id,
    environment,
    createdBy,
    terraformModule: claimName,
    version: blueprint.version,
    provider: "crossplane"
  }, description);

  const pr = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title,
    head: branchName,
    base: baseBranch,
    body
  });

  // Update YAML with actual PR number
  yamlContent = renderBuildingBlocksClaims({
    blueprint,
    variables,
    prNumber: pr.number,
    createdBy
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: `chore: update request-id labels with PR number #${pr.number}`,
    content: Buffer.from(yamlContent, "utf8").toString("base64"),
    branch: branchName,
    sha: file.content.sha
  });

  return {
    branchName,
    filePath,
    pullRequestUrl: pr.html_url,
    pullRequestNumber: pr.number,
    commitSha: file.commit.sha,
    provider: "crossplane",
    claimName,
    components: enabledComponents
  };
}

/**
 * Create a Terraform module PR (existing logic extracted)
 */
async function createTerraformRequest({
  octokit,
  infraOwner,
  infraRepo,
  baseBranch,
  branchName,
  blueprint,
  variables,
  moduleName,
  shortId,
  isUpdate,
  environment,
  createdBy
}) {
  // Render Terraform (handles both single blueprints and stacks)
  let tfContent;
  if (isStack(blueprint)) {
    tfContent = renderStackTerraform(blueprint, variables, moduleName);
  } else {
    tfContent = renderTerraformModule({
      moduleName,
      blueprint,
      variables,
      prNumber: moduleName
    });
  }

  const filePath = `infra/environments/${environment}/${moduleName}.tf`;

  // Get existing file SHA if updating
  const fileSha = isUpdate
    ? await getExistingFileSha(octokit, infraOwner, infraRepo, filePath, baseBranch)
    : null;

  const commitMessage = isUpdate
    ? `chore: update ${blueprint.id} in ${environment} (${moduleName})`
    : `chore: request ${blueprint.id} in ${environment} (${shortId})`;

  const { data: file } = await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(tfContent, "utf8").toString("base64"),
    branch: branchName,
    ...(fileSha && { sha: fileSha })
  });

  // Create PR
  const title = isUpdate
    ? `Update ${blueprint.displayName} in ${environment} (${moduleName})`
    : `Provision ${blueprint.displayName} in ${environment} (${shortId})`;

  const description = [
    isUpdate ? `**Update**: Modifying existing resource \`${moduleName}\`` : "",
    "",
    "Rendered module:",
    "```hcl",
    tfContent,
    "```"
  ].filter(Boolean).join("\n");

  const body = generatePRBody({
    blueprintId: blueprint.id,
    environment,
    createdBy,
    terraformModule: moduleName,
    version: blueprint.version
  }, description);

  const pr = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title,
    head: branchName,
    base: baseBranch,
    body
  });

  // Update with actual PR number
  let tfContentWithPR;
  if (isStack(blueprint)) {
    tfContentWithPR = renderStackTerraform(blueprint, variables, moduleName, pr.number);
  } else {
    tfContentWithPR = renderTerraformModule({
      moduleName,
      blueprint,
      variables,
      prNumber: pr.number
    });
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: filePath,
    message: `chore: update request-id tag with PR number #${pr.number}`,
    content: Buffer.from(tfContentWithPR, "utf8").toString("base64"),
    branch: branchName,
    sha: file.content.sha
  });

  return {
    branchName,
    filePath,
    pullRequestUrl: pr.html_url,
    pullRequestNumber: pr.number,
    commitSha: file.commit.sha,
    provider: "terraform"
  };
}
