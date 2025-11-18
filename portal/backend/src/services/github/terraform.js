/**
 * Fetch Terraform outputs from PR comments
 * Looks for comments starting with "TF_OUTPUTS:" and containing JSON
 * Optionally filters to only outputs matching a specific module name prefix
 */
export async function fetchTerraformOutputs({ octokit, owner, repo, prNumber, moduleName = null }) {
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

    const allOutputs = JSON.parse(match[1]);

    // If moduleName is provided, filter to only outputs for this module
    if (moduleName && typeof allOutputs === 'object' && allOutputs !== null) {
      const prefix = `${moduleName}_`;
      const filteredOutputs = {};

      for (const [key, value] of Object.entries(allOutputs)) {
        if (key.startsWith(prefix)) {
          // Remove the module name prefix for cleaner display
          const cleanKey = key.substring(prefix.length);
          filteredOutputs[cleanKey] = value;
        }
      }

      return Object.keys(filteredOutputs).length > 0 ? filteredOutputs : null;
    }

    return allOutputs;
  } catch (e) {
    console.warn(`Failed to parse TF outputs for PR #${prNumber}`, e.message);
    return null;
  }
}
