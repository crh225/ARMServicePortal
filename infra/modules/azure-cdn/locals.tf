# =============================================================================
# LOCALS
# =============================================================================

locals {
  name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-cdn"
    "armportal-owner"       = var.owner
  }

  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  all_tags = merge(local.armportal_tags_with_request, var.tags)

  # Content types to compress
  compressed_content_types = var.enable_compression ? [
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml",
    "text/xml",
    "text/plain",
    "image/svg+xml",
    "application/font-woff",
    "application/font-woff2"
  ] : []
}
