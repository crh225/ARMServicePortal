locals {
  app_name = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Parse environment variables from JSON
  env_vars = jsondecode(var.environment_variables)

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-container-app"
    "armportal-owner"       = var.owner
  }

  # Add request-id only if provided
  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  # Merge ARM Portal tags with user tags
  all_tags = merge(local.armportal_tags_with_request, var.tags)
}
