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
  description = "Existing resource group where the container app will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the container app"
}

variable "container_image" {
  type        = string
  description = "Container image to deploy (e.g., myacr.azurecr.io/myapp:latest)"
}

variable "container_registry_server" {
  type        = string
  description = "Container registry server (e.g., myacr.azurecr.io)"
  default     = ""
}

variable "container_registry_username" {
  type        = string
  description = "Container registry username (for private registries)"
  default     = ""
  sensitive   = true
}

variable "container_registry_password" {
  type        = string
  description = "Container registry password (for private registries)"
  default     = ""
  sensitive   = true
}

variable "cpu_cores" {
  type        = string
  description = "Number of CPU cores (0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2)"
  default     = "0.5"
}

variable "memory_gb" {
  type        = string
  description = "Amount of memory in GB (0.5, 1, 1.5, 2, 3, 4)"
  default     = "1"
}

variable "target_port" {
  type        = number
  description = "Container port that receives traffic"
  default     = 8000
}

variable "min_replicas" {
  type        = number
  description = "Minimum number of replicas"
  default     = 0
}

variable "max_replicas" {
  type        = number
  description = "Maximum number of replicas"
  default     = 3
}

variable "ingress_external" {
  type        = bool
  description = "Allow external ingress (public access)"
  default     = true
}

variable "environment_variables" {
  type        = string
  description = "Environment variables as JSON object (e.g., {\"KEY\":\"value\"})"
  default     = "{}"
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
  app_name = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Parse environment variables from JSON
  env_vars = jsondecode(var.environment_variables)

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-container-app"
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

# Container Apps Environment (required for Container Apps)
resource "azurerm_container_app_environment" "this" {
  name                = "${local.app_name}-env-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = local.all_tags
}

# Container App
resource "azurerm_container_app" "this" {
  name                         = "${local.app_name}-${random_string.suffix.result}"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"

  # Registry credentials (for private registries like ACR)
  dynamic "registry" {
    for_each = var.container_registry_server != "" ? [1] : []
    content {
      server               = var.container_registry_server
      username             = var.container_registry_username
      password_secret_name = "registry-password"
    }
  }

  # Secrets for registry password
  dynamic "secret" {
    for_each = var.container_registry_password != "" ? [1] : []
    content {
      name  = "registry-password"
      value = var.container_registry_password
    }
  }

  template {
    container {
      name   = local.app_name
      image  = var.container_image
      cpu    = tonumber(var.cpu_cores)
      memory = "${var.memory_gb}Gi"

      # Environment variables from JSON
      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }

    min_replicas = var.min_replicas
    max_replicas = var.max_replicas
  }

  ingress {
    external_enabled = var.ingress_external
    target_port      = var.target_port
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = local.all_tags
}

output "container_app_name" {
  value       = azurerm_container_app.this.name
  description = "The name of the container app"
}

output "container_app_environment_name" {
  value       = azurerm_container_app_environment.this.name
  description = "The name of the container app environment"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "fqdn" {
  value       = azurerm_container_app.this.latest_revision_fqdn
  description = "Fully qualified domain name of the container app"
}

output "url" {
  value       = "https://${azurerm_container_app.this.latest_revision_fqdn}"
  description = "URL to access the container app"
}
