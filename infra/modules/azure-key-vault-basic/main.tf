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

# Use the current ARM identity / service principal for tenant info
data "azurerm_client_config" "current" {}

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
  description = "Existing resource group where the Key Vault will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the Key Vault"
}

variable "sku_name" {
  type        = string
  description = "Key Vault SKU"
  default     = "standard"
}

variable "soft_delete_retention_days" {
  type        = number
  description = "Soft delete retention in days"
  default     = 7
}

variable "purge_protection_enabled" {
  type        = bool
  description = "Enable purge protection"
  default     = true
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
  # Key Vault names must be 3–24 chars, alphanumeric, globally unique.
  kv_name_prefix = lower(replace("${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))

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
  enable_rbac_authorization   = true
  soft_delete_retention_days  = var.soft_delete_retention_days
  purge_protection_enabled    = var.purge_protection_enabled
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

output "key_vault_name" {
  value = azurerm_key_vault.this.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "key_vault_id" {
  value = azurerm_key_vault.this.id
}
