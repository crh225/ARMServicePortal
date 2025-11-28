/**
 * Regular expression patterns for parsing GitHub PR bodies and comments
 */

/**
 * Metadata field patterns
 * Used to extract structured metadata from PR descriptions
 */
export const METADATA_PATTERNS = {
  blueprintId: /Blueprint:\s*`([^`]+)`/i,
  environment: /Environment:\s*`([^`]+)`/i,
  version: /Version:\s*`([^`]+)`/i,
  provider: /Provider:\s*`([^`]+)`/i,
  createdBy: /Created by:\s*@([^\s]+)/i,
  terraformModule: /Terraform Module:\s*`([^`]+)`/i
};

/**
 * Code block patterns
 * Used to extract code blocks from markdown
 */
export const CODE_BLOCK_PATTERNS = {
  hcl: /```hcl\n([\s\S]*?)\n```/,
  json: /```json([\s\S]*?)```/,
  terraform: /```terraform\n([\s\S]*?)\n```/,
  yaml: /```yaml\n([\s\S]*?)\n```/
};

/**
 * Label patterns for status detection
 * Supports environment-specific labels
 */
export const STATUS_LABEL_PATTERNS = {
  planOk: /^status:plan-ok(?:-(dev|qa|staging|prod))?$/,
  planFailed: /^status:plan-failed(?:-(dev|qa|staging|prod))?$/,
  applyOk: /^status:apply-ok(?:-(dev|qa|staging|prod))?$/,
  applyFailed: /^status:apply-failed(?:-(dev|qa|staging|prod))?$/
};

/**
 * Terraform output comment markers
 * Different environments use different comment formats
 */
export const TERRAFORM_OUTPUT_MARKERS = [
  "TF_OUTPUTS:",
  "Terraform Outputs:",
  "Terraform Deployment Complete"
];

/**
 * PR metadata comment patterns
 * HTML comment patterns used for storing structured metadata
 */
export const METADATA_COMMENT_PATTERNS = {
  destroysPr: /<!-- metadata:destroys-pr:(\d+) -->/,
  promotionSourcePr: /<!-- metadata:promotion:source-pr:(\d+) -->/,
  promotionSourceEnv: /<!-- metadata:promotion:source-env:(\w+) -->/,
  promotionTargetEnv: /<!-- metadata:promotion:target-env:(\w+) -->/
};
