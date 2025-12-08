locals {
  # Create a safe name prefix
  name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-app-configuration"
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

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_app_configuration" "this" {
  name                       = substr("${local.name_prefix}-${random_string.suffix.result}", 0, 50)
  resource_group_name        = var.resource_group_name
  location                   = var.location
  sku                        = var.sku
  local_auth_enabled         = var.local_auth_enabled
  public_network_access      = var.public_network_access
  soft_delete_retention_days = var.soft_delete_retention_days

  tags = local.all_tags
}
