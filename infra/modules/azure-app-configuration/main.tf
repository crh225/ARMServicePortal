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
