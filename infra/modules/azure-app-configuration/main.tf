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
  description = "Existing resource group where the App Configuration will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the App Configuration store"
}

variable "sku" {
  type        = string
  description = "App Configuration SKU (free or standard)"
  default     = "free"
  validation {
    condition     = contains(["free", "standard"], var.sku)
    error_message = "SKU must be 'free' or 'standard'."
  }
}

variable "soft_delete_retention_days" {
  type        = number
  description = "Number of days to retain soft-deleted data"
  default     = 7
}

variable "public_network_access" {
  type        = string
  description = "Public network access setting"
  default     = "Enabled"
  validation {
    condition     = contains(["Enabled", "Disabled"], var.public_network_access)
    error_message = "public_network_access must be 'Enabled' or 'Disabled'."
  }
}

variable "local_auth_enabled" {
  type        = bool
  description = "Enable local authentication (access keys)"
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

output "app_configuration_name" {
  value       = azurerm_app_configuration.this.name
  description = "Name of the App Configuration store"
}

output "endpoint" {
  value       = azurerm_app_configuration.this.endpoint
  description = "App Configuration endpoint URL"
}

output "primary_read_key" {
  value       = var.local_auth_enabled ? azurerm_app_configuration.this.primary_read_key[0].connection_string : null
  description = "Primary read-only connection string"
  sensitive   = true
}

output "primary_write_key" {
  value       = var.local_auth_enabled ? azurerm_app_configuration.this.primary_write_key[0].connection_string : null
  description = "Primary read-write connection string"
  sensitive   = true
}

output "resource_id" {
  value       = azurerm_app_configuration.this.id
  description = "Azure resource ID"
}
