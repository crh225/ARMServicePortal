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
  description = "Environment (e.g. dev, qa, staging, prod)"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group where the storage account will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the storage account"
}

variable "index_document" {
  type        = string
  description = "Index document for the static website"
  default     = "index.html"
}

variable "error_document" {
  type        = string
  description = "Error document for the static website"
  default     = "404.html"
}

variable "enable_cdn" {
  type        = string
  description = "Enable Azure CDN for the static website (true/false)"
  default     = "false"
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
  # Make a safe prefix from project + environment
  sa_name_prefix = lower(replace("${var.project_name}${var.environment}", "/[^a-z0-9]/", ""))
  enable_cdn_bool = var.enable_cdn == "true"

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-static-site"
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

  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  # Enable static website hosting
  static_website {
    index_document     = var.index_document
    error_404_document = var.error_document
  }

  # Allow public access for static website
  allow_nested_items_to_be_public = true

  tags = local.all_tags
}

# Optional CDN endpoint
resource "azurerm_cdn_profile" "this" {
  count               = local.enable_cdn_bool ? 1 : 0
  name                = "cdn-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard_Microsoft"

  tags = local.all_tags
}

resource "azurerm_cdn_endpoint" "this" {
  count               = local.enable_cdn_bool ? 1 : 0
  name                = "cdn-${var.project_name}-${var.environment}-${random_string.suffix.result}"
  profile_name        = azurerm_cdn_profile.this[0].name
  location            = var.location
  resource_group_name = var.resource_group_name

  origin {
    name      = "static-website"
    host_name = replace(replace(azurerm_storage_account.this.primary_web_endpoint, "https://", ""), "/", "")
  }

  is_http_allowed  = false
  is_https_allowed = true

  tags = local.all_tags
}

output "storage_account_name" {
  value       = azurerm_storage_account.this.name
  description = "The name of the created storage account"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "primary_web_endpoint" {
  value       = azurerm_storage_account.this.primary_web_endpoint
  description = "The primary static website endpoint"
}

output "cdn_endpoint" {
  value       = local.enable_cdn_bool ? azurerm_cdn_endpoint.this[0].fqdn : ""
  description = "The CDN endpoint FQDN (if CDN is enabled)"
}
