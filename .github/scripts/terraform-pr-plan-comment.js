/**
 * Posts a detailed Terraform plan comment on a PR with resource changes.
 *
 * Required environment variables:
 * - PLAN_OUTCOME: 'success' or 'failure'
 * - ENVIRONMENT: Environment name (dev, qa, staging, prod)
 * - TF_DIR: Terraform working directory
 *
 * @param {Object} params - GitHub Actions context
 * @param {Object} params.github - Octokit client
 * @param {Object} params.context - Actions context
 * @param {Object} params.core - Actions core utilities
 */
module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  const path = require('path');

  const outcome = process.env.PLAN_OUTCOME;
  const environment = process.env.ENVIRONMENT;
  const tfDir = process.env.TF_DIR;
  const planOutput = process.env.PLAN_OUTPUT || '';

  if (!outcome || !environment || !tfDir) {
    core.setFailed('Missing required environment variables: PLAN_OUTCOME, ENVIRONMENT, TF_DIR');
    return;
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issue_number = context.issue.number;

  // Parse the plan output to extract resource changes
  const parsePlanOutput = (output) => {
    const lines = output.split('\n');
    const resources = { create: [], update: [], destroy: [] };

    for (const line of lines) {
      // Match resource changes
      if (line.includes('# ') && (line.includes('will be created') || line.includes('must be replaced'))) {
        const resourceMatch = line.match(/#\s+([^\s]+)\s+will be created/);
        if (resourceMatch) {
          resources.create.push(resourceMatch[1]);
        }
      } else if (line.includes('# ') && line.includes('will be updated')) {
        const resourceMatch = line.match(/#\s+([^\s]+)\s+will be updated/);
        if (resourceMatch) {
          resources.update.push(resourceMatch[1]);
        }
      } else if (line.includes('# ') && line.includes('will be destroyed')) {
        const resourceMatch = line.match(/#\s+([^\s]+)\s+will be destroyed/);
        if (resourceMatch) {
          resources.destroy.push(resourceMatch[1]);
        }
      }
    }

    return resources;
  };

  // Extract resource counts from plan output
  const extractCounts = (output) => {
    const match = output.match(/Plan:\s+(\d+)\s+to add,\s+(\d+)\s+to change,\s+(\d+)\s+to destroy/);
    if (match) {
      return {
        add: parseInt(match[1], 10),
        change: parseInt(match[2], 10),
        destroy: parseInt(match[3], 10),
      };
    }
    return { add: 0, change: 0, destroy: 0 };
  };

  const resources = parsePlanOutput(planOutput);
  const counts = extractCounts(planOutput);

  // Build the comment header
  const envTitle = environment.charAt(0).toUpperCase() + environment.slice(1);
  let body = `## Terraform Plan - ${envTitle}\n\n`;

  if (outcome === 'success') {
    body += `### 📊 Resource Summary\n\n`;
    body += `<details>\n`;
    body += `<summary><strong>`;
    body += `🟢 create ${counts.add} · 🟡 update ${counts.change} · 🔴 destroy ${counts.destroy}`;
    body += `</strong></summary>\n\n`;
    body += `#### 📋 State refresh\n\n`;
    body += `Terraform used the selected providers to generate the following execution plan.\n`;
    body += `Resource actions are indicated with the following symbols:\n`;
    body += `- 🟢 update in-place\n`;
    body += `- 🔵 read (data resources)\n\n`;

    body += `Terraform will perform the following actions:\n\n`;

    // Show resources by type
    if (resources.create.length > 0) {
      body += `#### Resources to Create (${resources.create.length})\n\n`;
      body += '```diff\n';
      resources.create.forEach(res => {
        body += `+ ${res}\n`;
      });
      body += '```\n\n';
    }

    if (resources.update.length > 0) {
      body += `#### Resources to Update (${resources.update.length})\n\n`;
      body += '```diff\n';
      resources.update.forEach(res => {
        body += `~ ${res}\n`;
      });
      body += '```\n\n';
    }

    if (resources.destroy.length > 0) {
      body += `#### Resources to Destroy (${resources.destroy.length})\n\n`;
      body += '```diff\n';
      resources.destroy.forEach(res => {
        body += `- ${res}\n`;
      });
      body += '```\n\n';
    }

    // Show detailed plan output in collapsed section
    if (planOutput) {
      body += `#### 📄 Full Plan Output\n\n`;
      body += `<details>\n`;
      body += `<summary>Click to expand</summary>\n\n`;
      body += '```hcl\n';
      // Truncate if too long (GitHub comments have size limits)
      const maxLength = 60000;
      if (planOutput.length > maxLength) {
        body += planOutput.substring(0, maxLength) + '\n\n... (truncated)\n';
      } else {
        body += planOutput;
      }
      body += '\n```\n';
      body += `</details>\n\n`;
    }

    body += `</details>\n\n`;

    // Add production warning
    if (environment === 'prod') {
      body += `### ⚠️ Production Deployment\n\n`;
      body += `This PR targets production infrastructure. Required:\n`;
      body += `- ✅ Two approvals from platform team\n`;
      body += `- ✅ All CI checks passing\n`;
      body += `- ✅ Change control documentation\n\n`;
    }

    body += `---\n`;
    body += `**Environment:** \`${environment}\` | **Working Directory:** \`${tfDir}\`\n`;
    body += `**Workflow:** [${context.workflow}](${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId})\n`;

  } else {
    body += `### ❌ Plan Failed\n\n`;
    body += `Terraform plan failed for the **${environment}** environment.\n\n`;

    if (planOutput) {
      body += `#### Error Output\n\n`;
      body += '```\n';
      const maxLength = 10000;
      if (planOutput.length > maxLength) {
        body += planOutput.substring(0, maxLength) + '\n\n... (truncated)\n';
      } else {
        body += planOutput;
      }
      body += '\n```\n\n';
    }

    body += `**Workflow:** [${context.workflow}](${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId})\n`;
  }

  // Find existing plan comment and update or create new
  const comments = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number,
  });

  const botComment = comments.data.find(comment =>
    comment.user.type === 'Bot' &&
    comment.body.includes(`Terraform Plan - ${envTitle}`)
  );

  if (botComment) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: botComment.id,
      body,
    });
    core.info(`Updated existing plan comment ${botComment.id}`);
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
    core.info('Created new plan comment');
  }
};
