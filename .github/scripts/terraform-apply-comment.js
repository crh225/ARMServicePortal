/**
 * Comments on PR with Terraform apply results and updates labels.
 *
 * Required environment variables:
 * - APPLY_OUTCOME: 'success' or 'failure'
 * - ENVIRONMENT: Environment name (dev, qa, staging, prod)
 * - OUTPUTS_PATH: Path to tf-outputs.json
 * - BACKUP_BLOB: (optional) Blob path for backup
 * - BACKUP_TIMESTAMP: (optional) Backup timestamp
 * - BACKUP_GIT_SHA: (optional) Git SHA of backup
 *
 * @param {Object} params - GitHub Actions context
 * @param {Object} params.github - Octokit client
 * @param {Object} params.context - Actions context
 * @param {Object} params.core - Actions core utilities
 */
module.exports = async ({ github, context, core }) => {
  const fs = require('fs');

  const applyOutcome = process.env.APPLY_OUTCOME || 'unknown';
  const environment = process.env.ENVIRONMENT;
  const outputsPath = process.env.OUTPUTS_PATH;
  const backupBlob = process.env.BACKUP_BLOB || 'N/A';
  const backupTimestamp = process.env.BACKUP_TIMESTAMP || 'N/A';
  const backupGitSha = process.env.BACKUP_GIT_SHA || 'N/A';

  if (!environment || !outputsPath) {
    core.setFailed('Missing required environment variables: ENVIRONMENT, OUTPUTS_PATH');
    return;
  }

  // Read terraform outputs
  let outputs = null;
  try {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } catch (err) {
    core.warning(`Failed to read Terraform outputs at ${outputsPath}: ${err.message}`);
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const commitSha = context.sha;

  // Find PR associated with this commit
  const { data: prs } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });

  if (!prs || prs.length === 0) {
    core.info(`No PR found for commit ${commitSha}, skipping label/comment.`);
  } else {
    const pr = prs[0];
    const issue_number = pr.number;
    core.info(`Updating PR #${issue_number}`);

    // Update apply labels
    const APPLY_OK = `status:apply-ok-${environment}`;
    const APPLY_FAILED = `status:apply-failed-${environment}`;

    for (const label of [APPLY_OK, APPLY_FAILED]) {
      try {
        await github.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
      } catch (e) {
        // Ignore if label doesn't exist
      }
    }

    const applyLabel = applyOutcome === 'success' ? APPLY_OK : APPLY_FAILED;
    await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [applyLabel] });

    // Build comment body
    const envTitle = environment.charAt(0).toUpperCase() + environment.slice(1);
    let body = `## ${envTitle} Terraform Apply Result\n\n`;
    body += `**Status:** ${applyOutcome === 'success' ? '✅ Success' : '❌ Failed'}\n\n`;

    // Add backup info
    body += '### State Backup\n';
    if (backupBlob !== 'N/A') {
      body += `- **Backup Created:** ${backupTimestamp}\n`;
      body += `- **Git SHA:** ${backupGitSha}\n`;
      body += `- **Blob Path:** \`${backupBlob}\`\n\n`;
      body += 'To restore this backup if needed:\n';
      body += '```bash\n';
      body += `./infra/scripts/restore-tfstate.sh ${environment} ${backupBlob.split('/').pop()}\n`;
      body += '```\n\n';

      if (environment === 'prod') {
        body += '**Production rollback requires change control approval**\n\n';
      }
    } else {
      body += 'No backup created (first apply or state does not exist yet)\n\n';
    }

    // Extract module name from PR body for output filtering
    let moduleName = null;
    if (pr.body) {
      // Look for "- Terraform Module: `module-name`" or "- Claim Name: `claim-name`"
      const moduleMatch = pr.body.match(/- (?:Terraform Module|Claim Name):\s*`([^`]+)`/);
      if (moduleMatch && moduleMatch[1]) {
        moduleName = moduleMatch[1];
        core.info(`Found module name in PR body: ${moduleName}`);
      }
    }

    // Add TF outputs (filter out sensitive values and optionally filter by module)
    if (outputs) {
      const sanitizedOutputs = {};
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === 'object' && value !== null && value.sensitive === true) {
          continue;
        }
        sanitizedOutputs[key] = value;
      }

      // Filter outputs to only show those for this specific module
      let outputsToDisplay = sanitizedOutputs;
      if (moduleName && Object.keys(sanitizedOutputs).length > 0) {
        const prefix = `${moduleName}_`;
        const filteredOutputs = {};

        for (const [key, value] of Object.entries(sanitizedOutputs)) {
          if (key.startsWith(prefix)) {
            filteredOutputs[key] = value;
          }
        }

        // Use filtered outputs if any were found, otherwise show all
        if (Object.keys(filteredOutputs).length > 0) {
          outputsToDisplay = filteredOutputs;
          core.info(`Filtered to ${Object.keys(filteredOutputs).length} outputs for module ${moduleName}`);
        } else {
          core.warning(`No outputs found with prefix "${prefix}", showing all outputs`);
        }
      }

      if (Object.keys(outputsToDisplay).length > 0) {
        const pretty = JSON.stringify(outputsToDisplay, null, 2);
        body += '### Terraform Outputs\n\n';
        body += '```json\n';
        body += pretty + '\n';
        body += '```\n';
      }
    }

    await github.rest.issues.createComment({ owner, repo, issue_number, body });
  }

  // Fail workflow if apply failed
  if (applyOutcome !== 'success') {
    core.setFailed(`Terraform apply failed with outcome: ${applyOutcome}`);
  }
};
