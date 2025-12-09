/**
 * Posts lint results to PR (only on failure).
 *
 * Required environment variables:
 * - FMT_OUTCOME: 'success' or 'failure'
 * - VALIDATE_OUTCOME: 'success' or 'failure'
 * - ENVIRONMENT: Environment name
 */
module.exports = async ({ github, context, core }) => {
  const fmtOutcome = process.env.FMT_OUTCOME;
  const validateOutcome = process.env.VALIDATE_OUTCOME;
  const environment = process.env.ENVIRONMENT;

  const fmtIcon = fmtOutcome === 'success' ? '✅' : '❌';
  const validateIcon = validateOutcome === 'success' ? '✅' : '❌';

  const body = `### Terraform Lint Results (${environment})

| Check | Status |
|-------|--------|
| Format | ${fmtIcon} ${fmtOutcome} |
| Validate | ${validateIcon} ${validateOutcome} |
`;

  // Only comment if there's a failure
  if (fmtOutcome !== 'success' || validateOutcome !== 'success') {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: body.trim(),
    });
  }
};
