terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (dev, prod)"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "eastus2"
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
  rg_name = "${var.project_name}-${var.environment}-rg"

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-rg-basic"
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

resource "azurerm_resource_group" "this" {
  name     = local.rg_name
  location = var.location
  tags     = local.all_tags
}

output "resource_group_name" {
  value = azurerm_resource_group.this.name
}
