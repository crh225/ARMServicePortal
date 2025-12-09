locals {
  # Key Vault names must be 3-24 chars, alphanumeric, globally unique, and start with a letter.
  # Prefix with "kv" to ensure it always starts with a letter (in case project_name starts with a number)
  kv_name_prefix = lower(replace("kv${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-key-vault-basic"
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
