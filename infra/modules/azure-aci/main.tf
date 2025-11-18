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
  description = "Existing resource group where the container instance will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the container instance"
}

variable "container_image" {
  type        = string
  description = "Container image to deploy (e.g., mcr.microsoft.com/azuredocs/aci-helloworld:latest)"
  default     = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
}

variable "cpu_cores" {
  type        = string
  description = "Number of CPU cores (0.5, 1, 2, 4)"
  default     = "1"
}

variable "memory_gb" {
  type        = string
  description = "Amount of memory in GB (0.5, 1, 2, 4, 8)"
  default     = "1"
}

variable "port" {
  type        = string
  description = "Container port to expose"
  default     = "80"
}

variable "ip_address_type" {
  type        = string
  description = "IP address type: Public, Private, or None"
  default     = "Public"
}

variable "restart_policy" {
  type        = string
  description = "Restart policy: Always, OnFailure, or Never"
  default     = "Always"
}

variable "environment_variables" {
  type        = string
  description = "Environment variables as JSON object (e.g., {\"KEY\":\"value\"})"
  default     = "{}"
}

locals {
  container_name = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))
  dns_name_label = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Parse environment variables from JSON
  env_vars = jsondecode(var.environment_variables)

  # Determine if IP address should be configured
  enable_ip = var.ip_address_type != "None"
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_container_group" "this" {
  name                = "${local.container_name}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  restart_policy      = var.restart_policy

  # IP address configuration (only if enabled)
  ip_address_type = local.enable_ip ? var.ip_address_type : null
  dns_name_label  = local.enable_ip && var.ip_address_type == "Public" ? "${local.dns_name_label}-${random_string.suffix.result}" : null

  container {
    name   = local.container_name
    image  = var.container_image
    cpu    = tonumber(var.cpu_cores)
    memory = tonumber(var.memory_gb)

    # Ports configuration
    dynamic "ports" {
      for_each = var.port != "" && local.enable_ip ? [tonumber(var.port)] : []
      content {
        port     = ports.value
        protocol = "TCP"
      }
    }

    # Environment variables from JSON
    dynamic "environment_variables" {
      for_each = local.env_vars
      content {
        name  = environment_variables.key
        value = environment_variables.value
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

output "container_group_name" {
  value       = azurerm_container_group.this.name
  description = "The name of the container group"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "fqdn" {
  value       = local.enable_ip && var.ip_address_type == "Public" ? azurerm_container_group.this.fqdn : ""
  description = "Fully qualified domain name (only for public IP)"
}

output "ip_address" {
  value       = local.enable_ip ? azurerm_container_group.this.ip_address : ""
  description = "IP address of the container group"
}
