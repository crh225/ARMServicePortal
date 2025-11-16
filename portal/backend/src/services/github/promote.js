import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";

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

  // Get the original PR to find the module file
  const { data: originalPR } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: sourceJob.number
  });

  if (!originalPR.merged_at) {
    throw new Error("Cannot promote resource - source PR not merged");
  }

  const headRef = originalPR.head?.ref;
  if (!headRef || !headRef.startsWith("requests/")) {
    throw new Error("Invalid PR - not a resource request");
  }

  // Get the files changed in the original PR to find the .tf file
  const { data: files } = await octokit.pulls.listFiles({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: sourceJob.number
  });

  const tfFile = files.find(f => f.filename.endsWith(".tf") && !f.filename.includes(".destroy"));
  if (!tfFile) {
    throw new Error("No Terraform file found in source PR");
  }

  // Parse the source file to get configuration
  // Get the actual file content from the merged PR
  const { data: fileData } = await octokit.repos.getContent({
    owner: infraOwner,
    repo: infraRepo,
    path: tfFile.filename,
    ref: headRef
  });

  const sourceContent = Buffer.from(fileData.content, "base64").toString("utf8");

  // Generate new filename and content for target environment
  // Extract the environment path from the source file
  // e.g., infra/environments/dev/azure-rg-basic_abc123.tf -> infra/environments/qa/azure-rg-basic_abc123.tf
  const sourceEnvPath = `infra/environments/${sourceJob.environment}/`;
  const targetEnvPath = `infra/environments/${targetEnvironment}/`;

  if (!tfFile.filename.startsWith(sourceEnvPath)) {
    throw new Error(`Source file path doesn't match expected environment path: ${sourceEnvPath}`);
  }

  const baseFilename = tfFile.filename.replace(sourceEnvPath, "");
  const targetFilePath = targetEnvPath + baseFilename;

  // Create a new branch for the promotion
  const promotionBranchName = `requests/${targetEnvironment}/${baseFilename.replace(".tf", "")}-promoted-${Date.now()}`;
  const baseBranch = originalPR.base?.ref || "main";

  // Get the base branch reference
  const { data: baseBranchRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  // Create the promotion branch
  try {
    await octokit.git.createRef({
      owner: infraOwner,
      repo: infraRepo,
      ref: `refs/heads/${promotionBranchName}`,
      sha: baseBranchRef.object.sha
    });
  } catch (err) {
    if (err.status === 422) {
      // Branch already exists - use a new name with timestamp
      const uniqueBranchName = `${promotionBranchName}-${Math.random().toString(36).substring(7)}`;
      await octokit.git.createRef({
        owner: infraOwner,
        repo: infraRepo,
        ref: `refs/heads/${uniqueBranchName}`,
        sha: baseBranchRef.object.sha
      });
      promotionBranchName = uniqueBranchName;
    } else {
      throw err;
    }
  }

  // Create the new file in the target environment directory
  await octokit.repos.createOrUpdateFileContents({
    owner: infraOwner,
    repo: infraRepo,
    path: targetFilePath,
    message: `promote: ${sourceJob.environment} → ${targetEnvironment} (${baseFilename})`,
    content: Buffer.from(sourceContent, "utf8").toString("base64"),
    branch: promotionBranchName
  });

  // Build PR metadata
  const environmentEmojis = {
    dev: "🧪",
    qa: "🔍",
    staging: "🎭",
    prod: "🚀"
  };

  const approvalRequirements = {
    qa: "1 approval required",
    staging: "1 approval required + must match QA config",
    prod: "2 approvals required + change control documentation"
  };

  // Create the PR with detailed promotion info
  const prBody = [
    `## Environment Promotion`,
    ``,
    `${environmentEmojis[sourceJob.environment]} **${sourceJob.environment.toUpperCase()}** → ${environmentEmojis[targetEnvironment]} **${targetEnvironment.toUpperCase()}**`,
    ``,
    `**Source PR**: #${sourceJob.number}`,
    `**Blueprint**: ${sourceJob.blueprintId || "unknown"}`,
    `**Resource File**: \`${targetFilePath}\``,
    ``,
    `### Approval Requirements`,
    `${approvalRequirements[targetEnvironment] || "See governance policy"}`,
    ``,
    `### Configuration`,
    `This promotion copies the configuration from ${sourceJob.environment} (PR #${sourceJob.number}) to ${targetEnvironment}.`,
    ``,
    targetEnvironment === "staging" ? `⚠️ **Staging Validation**: Ensure this configuration matches the tested QA deployment.` : ``,
    targetEnvironment === "prod" ? `🔴 **Production Deployment**: This requires 2 approvals and change control documentation.` : ``,
    ``,
    `### Pre-Merge Checklist`,
    targetEnvironment === "qa" ? `- [ ] Configuration reviewed and approved` : ``,
    targetEnvironment === "staging" ? `- [ ] QA testing completed successfully\n- [ ] Configuration matches QA environment\n- [ ] Stakeholder approval obtained` : ``,
    targetEnvironment === "prod" ? `- [ ] Staging validation completed\n- [ ] Change control ticket created\n- [ ] Rollback plan documented\n- [ ] 2 required approvals obtained\n- [ ] Deployment window confirmed` : ``,
    ``,
    `---`,
    `<!-- metadata:promotion:source-pr:${sourceJob.number} -->`,
    `<!-- metadata:promotion:source-env:${sourceJob.environment} -->`,
    `<!-- metadata:promotion:target-env:${targetEnvironment} -->`,
  ].filter(Boolean).join("\n");

  const { data: promotionPR } = await octokit.pulls.create({
    owner: infraOwner,
    repo: infraRepo,
    title: `Promote ${sourceJob.blueprintId || "resource"} to ${targetEnvironment}`,
    head: promotionBranchName,
    base: baseBranch,
    body: prBody
  });

  // Add labels for tracking
  const labels = [
    "terraform-plan",
    `environment:${targetEnvironment}`,
    `promotion:${sourceJob.environment}-to-${targetEnvironment}`,
    `source-pr-${sourceJob.number}`
  ];

  if (targetEnvironment === "prod") {
    labels.push("priority:high");
  }

  await octokit.issues.addLabels({
    owner: infraOwner,
    repo: infraRepo,
    issue_number: promotionPR.number,
    labels
  });

  // Add a comment linking back to the source PR
  await octokit.issues.createComment({
    owner: infraOwner,
    repo: infraRepo,
    issue_number: promotionPR.number,
    body: `🔗 Promoted from #${sourceJob.number} (${sourceJob.environment} environment)`
  });

  // Add a comment to the source PR about the promotion
  await octokit.issues.createComment({
    owner: infraOwner,
    repo: infraRepo,
    issue_number: sourceJob.number,
    body: `📈 Promoted to ${targetEnvironment} in #${promotionPR.number}`
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
