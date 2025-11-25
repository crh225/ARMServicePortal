/**
 * Fetch Terraform outputs from PR comments
 * Looks for Terraform output comments (supports dev, qa, staging, prod formats) containing JSON
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

    console.log(`[TF Outputs] Fetching outputs for PR #${prNumber}, module: ${moduleName || 'all'}, found ${comments.length} comments`);

    // Debug: log all comment snippets
    comments.forEach((c, i) => {
      console.log(`[TF Outputs] Comment ${i + 1} by ${c.user?.login}: ${c.body?.substring(0, 100).replace(/\n/g, ' ')}...`);
    });

    // Look for Terraform output comments (supports multiple formats across environments)
    // - Dev: "TF_OUTPUTS:"
    // - QA: "**QA Terraform Outputs:**"
    // - Staging: "**Staging Terraform Outputs:**"
    // - Prod: "**Production Terraform Deployment Complete**"
    const tfComment = [...comments]
      .reverse()
      .find(
        (c) =>
          typeof c.body === "string" &&
          (c.body.startsWith("TF_OUTPUTS:") ||
           c.body.includes("Terraform Outputs:") ||
           c.body.includes("Terraform Deployment Complete") ||
           c.body.includes("Terraform Outputs") ||
           c.body.includes("Terraform Apply Result"))
      );

    if (!tfComment) {
      console.log(`[TF Outputs] No terraform output comment found in PR #${prNumber}`);
      return null;
    }

    console.log(`[TF Outputs] Found terraform comment in PR #${prNumber}, extracting JSON...`);

    // Try to extract JSON - supports two formats:
    // 1. Wrapped in ```json...``` code fence
    // 2. Raw JSON after "Terraform Outputs" header
    let jsonText = null;

    // Try format 1: code fence
    const codeFenceMatch = tfComment.body.match(/```json([\s\S]*?)```/);
    if (codeFenceMatch && codeFenceMatch[1]) {
      jsonText = codeFenceMatch[1];
    } else {
      // Try format 2: raw JSON after "Terraform Outputs" or similar header
      const headerMatch = tfComment.body.match(/###?\s*Terraform Outputs\s*\n([\s\S]*)/i);
      if (headerMatch && headerMatch[1]) {
        // Extract JSON object from the text
        const jsonMatch = headerMatch[1].match(/(\{[\s\S]*?\n\})/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1];
        }
      }
    }

    if (!jsonText) {
      console.log(`[TF Outputs] Could not extract JSON from comment in PR #${prNumber}`);
      return null;
    }

    const allOutputs = JSON.parse(jsonText.trim());

    // Filter out sensitive values before sending to frontend
    const sanitizedOutputs = {};
    for (const [key, value] of Object.entries(allOutputs)) {
      if (typeof value === 'object' && value !== null && value.sensitive === true) {
        // Don't send sensitive values to frontend at all
        continue;
      }
      sanitizedOutputs[key] = value;
    }

    // If moduleName is provided, filter to only outputs for this module
    if (moduleName && typeof sanitizedOutputs === 'object' && sanitizedOutputs !== null) {
      const prefix = `${moduleName}_`;
      const filteredOutputs = {};

      for (const [key, value] of Object.entries(sanitizedOutputs)) {
        if (key.startsWith(prefix)) {
          // Remove the module name prefix for cleaner display
          const cleanKey = key.substring(prefix.length);
          filteredOutputs[cleanKey] = value;
        }
      }

      // If we found filtered outputs, return them
      if (Object.keys(filteredOutputs).length > 0) {
        return filteredOutputs;
      }

      // If no filtered outputs found, log for debugging and return null
      console.warn(`No outputs found for module "${moduleName}" in PR #${prNumber}. Available outputs:`, Object.keys(sanitizedOutputs).join(', '));
      return null;
    }

    return sanitizedOutputs;
  } catch (e) {
    console.warn(`Failed to parse TF outputs for PR #${prNumber}`, e.message);
    return null;
  }
}
