/**
 * Labels a PR based on Terraform plan outcome.
 *
 * Required environment variables:
 * - PLAN_OUTCOME: 'success' or 'failure'
 * - ENVIRONMENT: Environment name (dev, qa, staging, prod)
 *
 * @param {Object} params - GitHub Actions context
 * @param {Object} params.github - Octokit client
 * @param {Object} params.context - Actions context
 * @param {Object} params.core - Actions core utilities
 */
module.exports = async ({ github, context, core }) => {
  const outcome = process.env.PLAN_OUTCOME;
  const environment = process.env.ENVIRONMENT;

  if (!outcome || !environment) {
    core.setFailed('Missing required environment variables: PLAN_OUTCOME, ENVIRONMENT');
    return;
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issue_number = context.issue.number;

  const PLAN_OK = `status:plan-ok-${environment}`;
  const PLAN_FAILED = `status:plan-failed-${environment}`;

  // Remove old plan labels
  for (const label of [PLAN_OK, PLAN_FAILED]) {
    try {
      await github.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
    } catch (e) {
      // Ignore if label doesn't exist
    }
  }

  // Add new label based on outcome
  const labelToAdd = outcome === 'success' ? PLAN_OK : PLAN_FAILED;
  const labels = [labelToAdd, `environment:${environment}`];

  // Add priority label for production
  if (environment === 'prod') {
    labels.push('priority:high');
  }

  await github.rest.issues.addLabels({ owner, repo, issue_number, labels });

  // Add production warning comment
  if (environment === 'prod') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: `**Production Deployment**\n\nThis PR targets production and requires:\n- 2 approvals\n- Successful terraform plan\n- All checks passing\n- Change control documentation\n\nPlan status: \`${outcome}\``,
    });
  }

  if (outcome !== 'success') {
    core.setFailed(`Terraform plan failed with outcome: ${outcome}`);
  }
};
