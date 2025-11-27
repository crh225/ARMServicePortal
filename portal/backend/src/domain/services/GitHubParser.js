/**
 * GitHub PR and comment parsing utilities
 * Centralized location for all GitHub response parsing logic
 */

import {
  METADATA_PATTERNS,
  CODE_BLOCK_PATTERNS,
  STATUS_LABEL_PATTERNS,
  TERRAFORM_OUTPUT_MARKERS,
  METADATA_COMMENT_PATTERNS
} from "../value-objects/ParserConstants.js";

/**
 * Extract a single metadata field from PR body
 * @param {string} body - PR body text
 * @param {RegExp} pattern - Regular expression pattern to match
 * @returns {string|null} - Extracted value or null
 */
function extractMetadataField(body, pattern) {
  if (!body) return null;

  const match = body.match(pattern);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Extract code block from markdown
 * @param {string} body - Markdown text
 * @param {RegExp} pattern - Code block pattern
 * @returns {string|null} - Extracted code or null
 */
function extractCodeBlock(body, pattern) {
  if (!body) return null;

  const match = body.match(pattern);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Parse blueprint metadata from PR body
 * @param {string} body - PR body text
 * @returns {Object} - Parsed metadata
 */
export function parseBlueprintMetadataFromBody(body) {
  if (!body) {
    return {
      blueprintId: null,
      environment: null,
      version: null,
      provider: null,
      terraformModule: null,
      createdBy: null
    };
  }

  return {
    blueprintId: extractMetadataField(body, METADATA_PATTERNS.blueprintId),
    environment: extractMetadataField(body, METADATA_PATTERNS.environment),
    version: extractMetadataField(body, METADATA_PATTERNS.version),
    provider: extractMetadataField(body, METADATA_PATTERNS.provider),
    terraformModule: extractCodeBlock(body, CODE_BLOCK_PATTERNS.hcl),
    createdBy: extractMetadataField(body, METADATA_PATTERNS.createdBy)
  };
}

/**
 * Parse promotion metadata from PR body
 * @param {string} body - PR body text
 * @returns {Object} - Promotion metadata
 */
export function parsePromotionMetadata(body) {
  if (!body) {
    return { sourcePr: null, sourceEnv: null, targetEnv: null };
  }

  return {
    sourcePr: extractMetadataField(body, METADATA_COMMENT_PATTERNS.promotionSourcePr),
    sourceEnv: extractMetadataField(body, METADATA_COMMENT_PATTERNS.promotionSourceEnv),
    targetEnv: extractMetadataField(body, METADATA_COMMENT_PATTERNS.promotionTargetEnv)
  };
}

/**
 * Parse destroy metadata from PR body
 * @param {string} body - PR body text
 * @returns {Object} - Destroy metadata
 */
export function parseDestroyMetadata(body) {
  if (!body) {
    return { destroysPr: null };
  }

  const match = body.match(METADATA_COMMENT_PATTERNS.destroysPr);
  return {
    destroysPr: match && match[1] ? parseInt(match[1], 10) : null
  };
}

/**
 * Check if label matches a status pattern
 * @param {string} labelName - Label name
 * @param {RegExp} pattern - Pattern to match
 * @returns {boolean} - True if matches
 */
function matchesStatusPattern(labelName, pattern) {
  return pattern.test(labelName);
}

/**
 * Map GitHub labels to plan/apply status
 * Supports environment-specific labels like status:plan-ok-qa, status:apply-ok-staging
 * @param {Array} labels - Array of label objects
 * @returns {Object} - Status mapping with planStatus, applyStatus, labels
 */
export function mapStatusFromLabels(labels) {
  const names = (labels || []).map((l) => l.name);

  let planStatus = "unknown";
  let applyStatus = "unknown";

  // Check for plan status labels
  const planOkLabel = names.find(l => matchesStatusPattern(l, STATUS_LABEL_PATTERNS.planOk));
  const planFailedLabel = names.find(l => matchesStatusPattern(l, STATUS_LABEL_PATTERNS.planFailed));

  if (planOkLabel) planStatus = "ok";
  if (planFailedLabel) planStatus = "failed";

  // Check for apply status labels
  const applyOkLabel = names.find(l => matchesStatusPattern(l, STATUS_LABEL_PATTERNS.applyOk));
  const applyFailedLabel = names.find(l => matchesStatusPattern(l, STATUS_LABEL_PATTERNS.applyFailed));

  if (applyOkLabel) applyStatus = "ok";
  if (applyFailedLabel) applyStatus = "failed";

  return { planStatus, applyStatus, labels: names };
}

/**
 * Check if comment contains Terraform outputs
 * @param {string} commentBody - Comment body text
 * @returns {boolean} - True if contains Terraform outputs
 */
export function isTerraformOutputComment(commentBody) {
  if (!commentBody || typeof commentBody !== "string") {
    return false;
  }

  return TERRAFORM_OUTPUT_MARKERS.some(marker => commentBody.includes(marker));
}

/**
 * Parse Terraform outputs from comment body
 * @param {string} commentBody - Comment body text
 * @returns {Object|null} - Parsed outputs or null
 */
export function parseTerraformOutputs(commentBody) {
  if (!commentBody) return null;

  const match = commentBody.match(CODE_BLOCK_PATTERNS.json);
  if (!match || !match[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (err) {
    console.error("Failed to parse Terraform outputs:", err);
    return null;
  }
}

/**
 * Filter outputs by module name prefix
 * @param {Object} outputs - All Terraform outputs
 * @param {string} moduleName - Module name to filter by
 * @returns {Object} - Filtered outputs
 */
export function filterOutputsByModule(outputs, moduleName) {
  if (!moduleName || !outputs || typeof outputs !== 'object') {
    return outputs;
  }

  const filtered = {};
  const prefix = `${moduleName}_`;

  for (const key in outputs) {
    if (key.startsWith(prefix)) {
      const newKey = key.replace(prefix, "");
      filtered[newKey] = outputs[key];
    }
  }

  return Object.keys(filtered).length > 0 ? filtered : outputs;
}

/**
 * Parse error message from GitHub API response
 * @param {Error} error - Error object
 * @returns {Object} - Parsed error details
 */
export function parseGitHubError(error) {
  const details = {
    message: error.message || "Unknown error",
    status: error.status || null,
    response: null
  };

  if (error.response && error.response.data) {
    details.response = error.response.data;
    if (error.response.data.message) {
      details.message = error.response.data.message;
    }
  }

  return details;
}
