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
 * Supports environment-specific labels like status:plan-ok-qa, status:apply-ok-staging
 */
export function mapStatusFromLabels(labels) {
  const names = (labels || []).map((l) => l.name);

  let planStatus = "unknown";
  let applyStatus = "unknown";

  // Check for any plan status label (dev, qa, staging, prod, or generic)
  const planOkLabel = names.find(l => l === "status:plan-ok" || l.match(/^status:plan-ok-(dev|qa|staging|prod)$/));
  const planFailedLabel = names.find(l => l === "status:plan-failed" || l.match(/^status:plan-failed-(dev|qa|staging|prod)$/));

  if (planOkLabel) planStatus = "ok";
  if (planFailedLabel) planStatus = "failed";

  // Check for any apply status label (dev, qa, staging, prod, or generic)
  const applyOkLabel = names.find(l => l === "status:apply-ok" || l.match(/^status:apply-ok-(dev|qa|staging|prod)$/));
  const applyFailedLabel = names.find(l => l === "status:apply-failed" || l.match(/^status:apply-failed-(dev|qa|staging|prod)$/));

  if (applyOkLabel) applyStatus = "ok";
  if (applyFailedLabel) applyStatus = "failed";

  return { planStatus, applyStatus, labels: names };
}
