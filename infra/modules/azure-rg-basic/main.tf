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

locals {
  rg_name = "${var.project_name}-${var.environment}-rg"
}

resource "azurerm_resource_group" "this" {
  name     = local.rg_name
  location = var.location
}

output "resource_group_name" {
  value = azurerm_resource_group.this.name
}
