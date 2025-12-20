# Use the current ARM identity / service principal for tenant info
data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_key_vault" "this" {
  name                = substr("${local.kv_name_prefix}${random_string.suffix.result}", 0, 24)
  resource_group_name = var.resource_group_name
  location            = var.location

  tenant_id = data.azurerm_client_config.current.tenant_id
  sku_name  = var.sku_name

  # Modern pattern: use RBAC instead of access policies
  rbac_authorization_enabled    = true
  soft_delete_retention_days    = var.soft_delete_retention_days
  purge_protection_enabled      = var.purge_protection_enabled
  public_network_access_enabled = true

  tags = local.all_tags
}

# Diagnostic settings to send audit logs to Log Analytics
resource "azurerm_monitor_diagnostic_setting" "keyvault_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "keyvault-logs-to-log-analytics"
  target_resource_id         = azurerm_key_vault.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
  }
}
