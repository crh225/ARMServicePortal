import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";
import { ensureBranch, getFileContent, commitFile } from "./utils/gitOperations.js";
import { createPR, updatePRLabels, addPRComment } from "./utils/prOperations.js";
import { DEFAULT_BASE_BRANCH } from "../../../config/githubConstants.js";

/**
 * Get source PR and validate it can be promoted
 */
async function getSourcePR(octokit, owner, repo, prNumber) {
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  if (!pr.merged_at) {
    throw new Error("Cannot promote resource - source PR not merged");
  }

  const headRef = pr.head?.ref;
  if (!headRef || !headRef.startsWith("requests/")) {
    throw new Error("Invalid PR - not a resource request");
  }

  return pr;
}

/**
 * Find Terraform file in source PR
 */
async function findTerraformFile(octokit, owner, repo, prNumber) {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });

  const tfFile = files.find(f => f.filename.endsWith(".tf") && !f.filename.includes(".destroy"));
  if (!tfFile) {
    throw new Error("No Terraform file found in source PR");
  }

  return tfFile;
}

/**
 * Update environment variable in Terraform content
 */
function updateEnvironmentInContent(content, sourceEnv, targetEnv) {
  const envVarPattern = new RegExp(`environment\\s*=\\s*"${sourceEnv}"`, 'g');
  return content.replace(envVarPattern, `environment = "${targetEnv}"`);
}

/**
 * Generate target file path from source file path
 */
function generateTargetFilePath(sourceFilePath, sourceEnv, targetEnv) {
  const sourceEnvPath = `infra/environments/${sourceEnv}/`;
  const targetEnvPath = `infra/environments/${targetEnv}/`;

  if (!sourceFilePath.startsWith(sourceEnvPath)) {
    throw new Error(`Source file path doesn't match expected environment path: ${sourceEnvPath}`);
  }

  const baseFilename = sourceFilePath.replace(sourceEnvPath, "");
  return targetEnvPath + baseFilename;
}

/**
 * Generate promotion branch name
 */
function generatePromotionBranchName(baseFilename, targetEnv) {
  const cleanName = baseFilename.replace(".tf", "");
  return `requests/${targetEnv}/${cleanName}-promoted-${Date.now()}`;
}

/**
 * Get approval requirements text for environment
 */
function getApprovalRequirements(targetEnv) {
  const requirements = {
    qa: "1 approval required",
    staging: "1 approval required + must match QA config",
    prod: "2 approvals required + change control documentation"
  };

  return requirements[targetEnv] || "See governance policy";
}

/**
 * Generate pre-merge checklist based on target environment
 */
function getPreMergeChecklist(targetEnv) {
  const checklists = {
    qa: [
      "- [ ] Configuration reviewed and approved"
    ],
    staging: [
      "- [ ] QA testing completed successfully",
      "- [ ] Configuration matches QA environment",
      "- [ ] Stakeholder approval obtained"
    ],
    prod: [
      "- [ ] Staging validation completed",
      "- [ ] Change control ticket created",
      "- [ ] Rollback plan documented",
      "- [ ] 2 required approvals obtained",
      "- [ ] Deployment window confirmed"
    ]
  };

  return checklists[targetEnv] || [];
}

/**
 * Generate environment-specific warnings
 */
function getEnvironmentWarnings(targetEnv) {
  const warnings = {
    staging: "**Staging Validation**: Ensure this configuration matches the tested QA deployment.",
    prod: "**Production Deployment**: This requires 2 approvals and change control documentation."
  };

  return warnings[targetEnv] || null;
}

/**
 * Generate promotion PR body
 */
function generatePromotionPRBody(sourceJob, targetEnv, targetFilePath, updatedContent) {
  const parts = [
    `Blueprint: \`${sourceJob.blueprintId || "unknown"}\``,
    `Environment: \`${targetEnv}\``,
    ``,
    `## Environment Promotion`,
    ``,
    `**${sourceJob.environment.toUpperCase()}** → **${targetEnv.toUpperCase()}**`,
    ``,
    `**Source PR**: #${sourceJob.number}`,
    `**Resource File**: \`${targetFilePath}\``,
    ``,
    `### Approval Requirements`,
    getApprovalRequirements(targetEnv),
    ``,
    `### Configuration`,
    `This promotion copies the configuration from ${sourceJob.environment} (PR #${sourceJob.number}) to ${targetEnv}.`,
    ``
  ];

  // Add environment-specific warnings
  const warning = getEnvironmentWarnings(targetEnv);
  if (warning) {
    parts.push(warning);
    parts.push(``);
  }

  // Add pre-merge checklist
  const checklist = getPreMergeChecklist(targetEnv);
  if (checklist.length > 0) {
    parts.push(`### Pre-Merge Checklist`);
    parts.push(...checklist);
    parts.push(``);
  }

  // Add Terraform module content
  parts.push(`### Terraform Module`);
  parts.push(``);
  parts.push(`\`\`\`hcl`);
  parts.push(updatedContent);
  parts.push(`\`\`\``);
  parts.push(``);

  // Add metadata
  parts.push(`---`);
  parts.push(`<!-- metadata:promotion:source-pr:${sourceJob.number} -->`);
  parts.push(`<!-- metadata:promotion:source-env:${sourceJob.environment} -->`);
  parts.push(`<!-- metadata:promotion:target-env:${targetEnv} -->`);

  return parts.join("\n");
}

/**
 * Generate PR labels for promotion
 */
function generatePromotionLabels(sourceEnv, targetEnv, sourceNumber) {
  const labels = [
    "terraform-plan",
    `environment:${targetEnv}`,
    `promotion:${sourceEnv}-to-${targetEnv}`,
    `source-pr-${sourceNumber}`
  ];

  if (targetEnv === "prod") {
    labels.push("priority:high");
  }

  return labels;
}

/**
 * Create a PR to promote a deployed resource to the next environment
 * @param {Object} sourceJob - The source job/resource to promote
 * @param {string} targetEnvironment - The target environment (qa, staging, prod)
 * @returns {Promise<Object>} - The created PR details
 */
export async function createPromotionPR(sourceJob, targetEnvironment) {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // Get and validate source PR
  const sourcePR = await getSourcePR(octokit, infraOwner, infraRepo, sourceJob.number);

  // Find Terraform file
  const tfFile = await findTerraformFile(octokit, infraOwner, infraRepo, sourceJob.number);

  // Get file content from source branch
  const fileData = await getFileContent(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    path: tfFile.filename,
    ref: sourcePR.head.ref
  });

  // Update environment variable in content
  const updatedContent = updateEnvironmentInContent(
    fileData.content,
    sourceJob.environment,
    targetEnvironment
  );

  // Generate target file path
  const targetFilePath = generateTargetFilePath(
    tfFile.filename,
    sourceJob.environment,
    targetEnvironment
  );

  const baseFilename = tfFile.filename.replace(`infra/environments/${sourceJob.environment}/`, "");
  const baseBranch = sourcePR.base?.ref || DEFAULT_BASE_BRANCH;

  // Get base branch SHA
  const { data: baseBranchRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  // Create promotion branch
  const promotionBranchName = generatePromotionBranchName(baseFilename, targetEnvironment);
  await ensureBranch(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    branchName: promotionBranchName,
    baseSha: baseBranchRef.object.sha,
    forceRecreate: true
  });

  // Commit file to promotion branch
  await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: targetFilePath,
    message: `promote: ${sourceJob.environment} -> ${targetEnvironment} (${baseFilename})`,
    content: Buffer.from(updatedContent, "utf8").toString("base64"),
    branch: promotionBranchName
  });

  // Generate PR body
  const prBody = generatePromotionPRBody(sourceJob, targetEnvironment, targetFilePath, updatedContent);

  // Create promotion PR
  const promotionPR = await createPR(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    title: `Promote ${sourceJob.blueprintId || "resource"} to ${targetEnvironment}`,
    head: promotionBranchName,
    base: baseBranch,
    body: prBody
  });

  // Add labels
  const labels = generatePromotionLabels(sourceJob.environment, targetEnvironment, sourceJob.number);
  await updatePRLabels(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    issueNumber: promotionPR.number,
    labels
  });

  // Add comment to promotion PR
  await addPRComment(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    issueNumber: promotionPR.number,
    body: `Promoted from #${sourceJob.number} (${sourceJob.environment} environment)`
  });

  // Add comment to source PR
  await addPRComment(octokit, {
    owner: infraOwner,
    repo: infraRepo,
    issueNumber: sourceJob.number,
    body: `Promoted to ${targetEnvironment} in #${promotionPR.number}`
  });

  return {
    number: promotionPR.number,
    url: promotionPR.html_url,
    branch: promotionBranchName,
    title: promotionPR.title,
    sourceEnvironment: sourceJob.environment,
    targetEnvironment
  };
}
