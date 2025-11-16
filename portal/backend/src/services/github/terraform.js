/**
 * Fetch Terraform outputs from PR comments
 * Looks for comments starting with "TF_OUTPUTS:" and containing JSON
 */
export async function fetchTerraformOutputs({ octokit, owner, repo, prNumber }) {
  try {
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 50
    });

    const tfComment = [...comments]
      .reverse()
      .find(
        (c) =>
          typeof c.body === "string" && c.body.startsWith("TF_OUTPUTS:")
      );

    if (!tfComment) {
      return null;
    }

    const match = tfComment.body.match(/```json([\s\S]*?)```/);
    if (!match || !match[1]) {
      return null;
    }

    return JSON.parse(match[1]);
  } catch (e) {
    console.warn(`Failed to parse TF outputs for PR #${prNumber}`, e.message);
    return null;
  }
}
