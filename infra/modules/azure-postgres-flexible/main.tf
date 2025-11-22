terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (e.g. dev, prod)"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group where the PostgreSQL server will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the PostgreSQL server"
}

variable "postgres_version" {
  type        = string
  description = "PostgreSQL version"
  default     = "16"
}

variable "sku_name" {
  type        = string
  description = "SKU name for the PostgreSQL server"
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  type        = number
  description = "Storage size in MB"
  default     = 32768
}

variable "backup_retention_days" {
  type        = number
  description = "Backup retention in days"
  default     = 7
}

variable "geo_redundant_backup" {
  type        = bool
  description = "Enable geo-redundant backups"
  default     = false
}

variable "admin_username" {
  type        = string
  description = "Administrator username for PostgreSQL"
  default     = null
}

variable "high_availability_mode" {
  type        = string
  description = "High availability mode (ZoneRedundant or SameZone or disabled)"
  default     = "disabled"
}

variable "database_name" {
  type        = string
  description = "Name of the database to create"
  default     = "appdb"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to resources"
  default     = {}
}

variable "request_id" {
  type        = string
  description = "ARM Portal request ID (PR number)"
  default     = null
}

variable "owner" {
  type        = string
  description = "ARM Portal owner"
  default     = "crh225"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for diagnostic settings"
  default     = null
}

locals {
  # Make a safe prefix from project + environment
  server_name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Generate admin username if not provided (for security - not hardcoded)
  admin_username = var.admin_username != null ? var.admin_username : "admin_${random_string.suffix.result}"

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-postgres-flexible"
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

resource "random_password" "admin_password" {
  length  = 32
  special = true
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                = "${local.server_name_prefix}-psql-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  version                      = var.postgres_version
  administrator_login          = local.admin_username
  administrator_password       = random_password.admin_password.result

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

output "server_name" {
  value       = azurerm_postgresql_flexible_server.this.name
  description = "The name of the PostgreSQL server"
}

output "server_fqdn" {
  value       = azurerm_postgresql_flexible_server.this.fqdn
  description = "The FQDN of the PostgreSQL server"
}

output "database_name" {
  value       = azurerm_postgresql_flexible_server_database.this.name
  description = "The name of the database"
}

output "admin_username" {
  value       = local.admin_username
  description = "The administrator username"
  sensitive   = true
}

output "admin_password" {
  value       = random_password.admin_password.result
  description = "The administrator password"
  sensitive   = true
}

output "connection_string" {
  value       = "postgresql://${local.admin_username}:${random_password.admin_password.result}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
  description = "PostgreSQL connection string"
  sensitive   = true
}
