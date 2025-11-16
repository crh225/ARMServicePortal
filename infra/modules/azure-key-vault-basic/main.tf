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

locals {
  # Key Vault names must be 3–24 chars, alphanumeric, globally unique.
  kv_name_prefix = lower(replace("${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))
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

  # You can add additional network rules / tags here later if needed
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
