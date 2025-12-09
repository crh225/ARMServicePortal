locals {
  container_name = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))
  dns_name_label = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Parse environment variables from JSON
  env_vars = jsondecode(var.environment_variables)

  # Determine if IP address should be configured
  enable_ip = var.ip_address_type != "None"

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-aci"
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
