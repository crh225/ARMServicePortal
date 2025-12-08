locals {
  # Make a safe prefix from project + environment
  sa_name_prefix = lower(replace("${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-storage-basic"
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

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "this" {
  name                = substr("${local.sa_name_prefix}${random_string.suffix.result}", 0, 24)
  resource_group_name = var.resource_group_name
  location            = var.location

  account_tier             = var.account_tier
  account_replication_type = var.replication_type

  # `kind` is no longer a valid argument in azurerm v4.x – it's computed.
  # Default behavior is effectively a general purpose v2 account.
  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  allow_nested_items_to_be_public = true

  tags = local.all_tags
}

# Diagnostic settings to send logs to Log Analytics
resource "azurerm_monitor_diagnostic_setting" "blob_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "blob-logs-to-log-analytics"
  target_resource_id         = "${azurerm_storage_account.this.id}/blobServices/default/"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
  }
}

resource "azurerm_monitor_diagnostic_setting" "queue_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "queue-logs-to-log-analytics"
  target_resource_id         = "${azurerm_storage_account.this.id}/queueServices/default/"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
  }
}

resource "azurerm_monitor_diagnostic_setting" "table_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "table-logs-to-log-analytics"
  target_resource_id         = "${azurerm_storage_account.this.id}/tableServices/default/"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
  }
}

resource "azurerm_monitor_diagnostic_setting" "file_logs" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "file-logs-to-log-analytics"
  target_resource_id         = "${azurerm_storage_account.this.id}/fileServices/default/"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
  }
}
