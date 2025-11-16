/**
 * Parse blueprint metadata from PR body
 */
export function parseBlueprintMetadataFromBody(body) {
  if (!body) {
    return { blueprintId: null, environment: null, terraformModule: null };
  }

  let blueprintId = null;
  let environment = null;
  let terraformModule = null;

  const blueprintMatch = body.match(/Blueprint:\s*`([^`]+)`/i);
  if (blueprintMatch && blueprintMatch[1]) {
    blueprintId = blueprintMatch[1].trim();
  }

  const envMatch = body.match(/Environment:\s*`([^`]+)`/i);
  if (envMatch && envMatch[1]) {
    environment = envMatch[1].trim();
  }

  // Extract the Terraform module from the code block
  const tfMatch = body.match(/```hcl\n([\s\S]*?)\n```/);
  if (tfMatch && tfMatch[1]) {
    terraformModule = tfMatch[1].trim();
  }

  return { blueprintId, environment, terraformModule };
}

/**
 * Map GitHub labels to plan/apply status
 */
export function mapStatusFromLabels(labels) {
  const names = (labels || []).map((l) => l.name);

  let planStatus = "unknown";
  if (names.includes("status:plan-ok")) planStatus = "ok";
  if (names.includes("status:plan-failed")) planStatus = "failed";

  let applyStatus = "unknown";
  if (names.includes("status:apply-ok")) applyStatus = "ok";
  if (names.includes("status:apply-failed")) applyStatus = "failed";

  return { planStatus, applyStatus, labels: names };
}
