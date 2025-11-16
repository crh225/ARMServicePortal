import { getInstallationClient } from "./client.js";
import { getGitHubConfig } from "./config.js";

/**
 * Create a PR to delete a deployed resource (runs terraform destroy)
 * @param {number} prNumber - The PR number of the deployed resource
 * @returns {Promise<Object>} - The created PR details
 */
export async function createDestroyPR(prNumber) {
  const { infraOwner, infraRepo } = getGitHubConfig();

  if (!infraOwner || !infraRepo) {
    throw new Error("GH_INFRA_OWNER and GH_INFRA_REPO must be set");
  }

  const octokit = await getInstallationClient();

  // Get the original PR to find the module file
  const { data: originalPR } = await octokit.pulls.get({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  if (!originalPR.merged_at) {
    throw new Error("Cannot delete resource - PR not merged");
  }

  const headRef = originalPR.head?.ref;
  if (!headRef || !headRef.startsWith("requests/")) {
    throw new Error("Invalid PR - not a resource request");
  }

  // Get the files changed in the original PR to find the .tf file
  const { data: files } = await octokit.pulls.listFiles({
    owner: infraOwner,
    repo: infraRepo,
    pull_number: prNumber
  });

  const tfFile = files.find(f => f.filename.endsWith(".tf"));
  if (!tfFile) {
    throw new Error("No Terraform file found in original PR");
  }

  // Create a new branch for the destroy operation
  const destroyBranchName = `destroy/${headRef.replace("requests/", "")}`;
  const baseBranch = originalPR.base?.ref || "main";

  // Get the base branch reference
  const { data: baseBranchRef } = await octokit.git.getRef({
    owner: infraOwner,
    repo: infraRepo,
    ref: `heads/${baseBranch}`
  });

  // Create the destroy branch
  try {
    await octokit.git.createRef({
      owner: infraOwner,
      repo: infraRepo,
      ref: `refs/heads/${destroyBranchName}`,
      sha: baseBranchRef.object.sha
    });
  } catch (err) {
    if (err.status === 422) {
      // Branch already exists, delete and recreate
      await octokit.git.deleteRef({
        owner: infraOwner,
        repo: infraRepo,
        ref: `heads/${destroyBranchName}`
      });
      await octokit.git.createRef({
        owner: infraOwner,
        repo: infraRepo,
        ref: `refs/heads/${destroyBranchName}`,
        sha: baseBranchRef.object.sha
      });
    } else {
      throw err;
    }
  }

  // Try to get the file from the base branch
  // If it doesn't exist there, we'll create the file first (empty) then delete it
  // This handles the case where the PR was merged but files aren't on main
  let fileContent;
  let fileExistsOnBase = true;

  try {
    const result = await octokit.repos.getContent({
      owner: infraOwner,
      repo: infraRepo,
      path: tfFile.filename,
      ref: baseBranch
    });
    fileContent = result.data;
  } catch (err) {
    if (err.status === 404) {
      fileExistsOnBase = false;
    } else {
      throw err;
    }
  }

  if (fileExistsOnBase) {
    // File exists on base branch, delete it from the destroy branch
    await octokit.repos.deleteFile({
      owner: infraOwner,
      repo: infraRepo,
      path: tfFile.filename,
      message: `destroy: remove ${tfFile.filename}`,
      sha: fileContent.sha,
      branch: destroyBranchName
    });
  } else {
    // File doesn't exist on base - this means the infra files are ephemeral
    // We'll create a special marker file to trigger terraform destroy
    const markerPath = tfFile.filename.replace('.tf', '.destroy');
    const markerContent = `# Destroy marker for ${tfFile.filename}\n# Original PR: #${prNumber}\n# This file triggers terraform destroy for the associated resources\n`;

    await octokit.repos.createOrUpdateFileContents({
      owner: infraOwner,
      repo: infraRepo,
      path: markerPath,
      message: `destroy: mark ${tfFile.filename} for destruction`,
      content: Buffer.from(markerContent, "utf8").toString("base64"),
      branch: destroyBranchName
    });
  }

  // Create the PR with metadata in the body
  const prBody = [
    `## Destroy Resource`,
    ``,
    `This PR will destroy the infrastructure deployed in #${prNumber}.`,
    ``,
    `**Original PR**: #${prNumber}`,
    `**Resource File**: \`${tfFile.filename}\``,
    fileExistsOnBase ? `` : `**Note**: Resource file not on base branch - using marker file for destroy`,
    ``,
    `⚠️ **Warning**: Merging this PR will run \`terraform destroy\` and permanently delete the deployed resources.`,
    ``,
    `---`,
    `<!-- metadata:destroys-pr:${prNumber} -->`,
  ].filter(Boolean).join("\n");

  const { data: destroyPR } = await octokit.pulls.create({
    owner: infraOwner,
    repo: infraRepo,
    title: `Destroy: ${originalPR.title}`,
    head: destroyBranchName,
    base: baseBranch,
    body: prBody
  });

  // Add destroy label and link to original PR
  await octokit.issues.addLabels({
    owner: infraOwner,
    repo: infraRepo,
    issue_number: destroyPR.number,
    labels: ["terraform-destroy", `destroys-pr-${prNumber}`]
  });

  return {
    number: destroyPR.number,
    url: destroyPR.html_url,
    branch: destroyBranchName,
    title: destroyPR.title
  };
}
