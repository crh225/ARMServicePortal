locals {
  # Make a safe prefix from project + environment
  sa_name_prefix = lower(replace("${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))
  enable_cdn_bool = var.enable_cdn == "true"

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-static-site"
    "armportal-owner"       = var.owner
  }

  # Add request-id only if provided
  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  # Merge ARM Portal tags with user tags (user tags can override)
  all_tags = merge(local.armportal_tags_with_request, var.tags)
}
