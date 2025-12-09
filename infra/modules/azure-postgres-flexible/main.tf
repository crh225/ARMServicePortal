resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "random_password" "admin_password" {
  length  = 32
  special = true
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                = "${local.server_name_prefix}-psql-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  version                = var.postgres_version
  administrator_login    = local.admin_username
  administrator_password = random_password.admin_password.result

  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup

  # High availability configuration
  dynamic "high_availability" {
    for_each = var.high_availability_mode != "disabled" ? [1] : []
    content {
      mode = var.high_availability_mode
    }
  }

  tags = local.all_tags

  # Ignore zone changes - Azure assigns a zone at creation and it cannot be changed
  # without destroying and recreating the server
  lifecycle {
    ignore_changes = [zone]
  }
}

# Allow Azure services to access the server
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Create the default database
resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Diagnostic settings to send logs to Log Analytics
resource "azurerm_monitor_diagnostic_setting" "postgres_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "postgres-logs-to-log-analytics"
  target_resource_id         = azurerm_postgresql_flexible_server.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
  }
}
