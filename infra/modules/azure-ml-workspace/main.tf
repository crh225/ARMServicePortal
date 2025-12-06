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
  description = "Environment (dev, prod)"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "eastus2"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
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

variable "sku_name" {
  type        = string
  description = "SKU for Azure ML Workspace"
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Enterprise"], var.sku_name)
    error_message = "SKU must be Basic or Enterprise."
  }
}

variable "storage_account_tier" {
  type        = string
  description = "Storage account tier for ML data"
  default     = "Standard"
}

variable "storage_account_replication" {
  type        = string
  description = "Storage account replication type"
  default     = "LRS"
}

variable "compute_cluster_vm_size" {
  type        = string
  description = "VM size for compute cluster"
  default     = "Standard_DS2_v2"
}

variable "compute_cluster_min_nodes" {
  type        = number
  description = "Minimum nodes in compute cluster (set to 0 to save costs)"
  default     = 0
}

variable "compute_cluster_max_nodes" {
  type        = number
  description = "Maximum nodes in compute cluster"
  default     = 2
}

variable "compute_cluster_priority" {
  type        = string
  description = "VM priority (LowPriority for cost savings, Dedicated for reliability)"
  default     = "LowPriority"
}

variable "create_compute_cluster" {
  type        = bool
  description = "Whether to create the compute cluster (requires vCPU quota - check your subscription limits)"
  default     = false
}

locals {
  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-ml-workspace"
    "armportal-owner"       = var.owner
  }

  # Add request-id only if provided
  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  # Merge ARM Portal tags with user tags
  all_tags = merge(local.armportal_tags_with_request, var.tags)

  # Generate unique suffix for globally unique names
  name_suffix = random_string.suffix.result
}

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
  numeric = true
}

# Data source for current Azure client
data "azurerm_client_config" "current" {}

# Storage Account for ML Workspace
resource "azurerm_storage_account" "ml_storage" {
  name                     = "mlstor${var.project_name}${local.name_suffix}"
  location                 = var.location
  resource_group_name      = var.resource_group_name
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_account_replication

  tags = local.all_tags
}

# Storage containers for ML data
resource "azurerm_storage_container" "ml_data" {
  name                  = "mldata"
  storage_account_id    = azurerm_storage_account.ml_storage.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "ml_models" {
  name                  = "models"
  storage_account_id    = azurerm_storage_account.ml_storage.id
  container_access_type = "private"
}

# Key Vault for ML Workspace secrets
resource "azurerm_key_vault" "ml_keyvault" {
  name                       = "mlkv${var.project_name}${local.name_suffix}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = false
  soft_delete_retention_days = 7

  enable_rbac_authorization = true

  tags = local.all_tags
}

# Application Insights for ML Workspace monitoring
resource "azurerm_application_insights" "ml_insights" {
  name                = "mlinsights-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"

  tags = local.all_tags
}

# Container Registry for ML models
resource "azurerm_container_registry" "ml_acr" {
  name                = "mlacr${var.project_name}${local.name_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Basic"
  admin_enabled       = true

  tags = local.all_tags
}

# Azure Machine Learning Workspace
resource "azurerm_machine_learning_workspace" "ml_workspace" {
  name                          = "mlws-${var.project_name}-${var.environment}"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  application_insights_id       = azurerm_application_insights.ml_insights.id
  key_vault_id                  = azurerm_key_vault.ml_keyvault.id
  storage_account_id            = azurerm_storage_account.ml_storage.id
  container_registry_id         = azurerm_container_registry.ml_acr.id
  sku_name                      = var.sku_name
  public_network_access_enabled = true

  identity {
    type = "SystemAssigned"
  }

  tags = local.all_tags
}

# Compute Cluster for training jobs (optional - requires vCPU quota)
resource "azurerm_machine_learning_compute_cluster" "training_cluster" {
  count                         = var.create_compute_cluster ? 1 : 0
  name                          = "training-cluster"
  location                      = var.location
  machine_learning_workspace_id = azurerm_machine_learning_workspace.ml_workspace.id
  vm_priority                   = var.compute_cluster_priority
  vm_size                       = var.compute_cluster_vm_size

  scale_settings {
    min_node_count                       = var.compute_cluster_min_nodes
    max_node_count                       = var.compute_cluster_max_nodes
    scale_down_nodes_after_idle_duration = "PT5M" # Scale down after 5 minutes idle
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.all_tags
}

# Note: Azure ML Workspace automatically gets necessary permissions via its managed identity.
# These explicit role assignments are commented out to avoid "already exists" conflicts.
# Uncomment if you need to explicitly manage RBAC permissions.

# # Role assignment for ML workspace to access storage
# resource "azurerm_role_assignment" "ml_storage_contributor" {
#   scope                = azurerm_storage_account.ml_storage.id
#   role_definition_name = "Storage Blob Data Contributor"
#   principal_id         = azurerm_machine_learning_workspace.ml_workspace.identity[0].principal_id
#   skip_service_principal_aad_check = true
# }

# # Role assignment for ML workspace to access Key Vault
# resource "azurerm_role_assignment" "ml_keyvault_secrets" {
#   scope                = azurerm_key_vault.ml_keyvault.id
#   role_definition_name = "Key Vault Secrets Officer"
#   principal_id         = azurerm_machine_learning_workspace.ml_workspace.identity[0].principal_id
#   skip_service_principal_aad_check = true
# }

# Outputs
output "workspace_name" {
  description = "Azure ML Workspace name"
  value       = azurerm_machine_learning_workspace.ml_workspace.name
}

output "workspace_id" {
  description = "Azure ML Workspace ID"
  value       = azurerm_machine_learning_workspace.ml_workspace.id
}

output "workspace_url" {
  description = "Azure ML Studio URL"
  value       = "https://ml.azure.com/home?wsid=${azurerm_machine_learning_workspace.ml_workspace.id}"
}

output "storage_account_name" {
  description = "Storage account name for ML data"
  value       = azurerm_storage_account.ml_storage.name
}

output "storage_account_connection_string" {
  description = "Storage account connection string"
  value       = azurerm_storage_account.ml_storage.primary_connection_string
  sensitive   = true
}

output "container_registry_login_server" {
  description = "Container registry login server"
  value       = azurerm_container_registry.ml_acr.login_server
}

output "container_registry_admin_username" {
  description = "Container registry admin username"
  value       = azurerm_container_registry.ml_acr.admin_username
}

output "container_registry_admin_password" {
  description = "Container registry admin password"
  value       = azurerm_container_registry.ml_acr.admin_password
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.ml_insights.connection_string
  sensitive   = true
}

output "compute_cluster_name" {
  description = "Training compute cluster name (empty if not created)"
  value       = var.create_compute_cluster ? azurerm_machine_learning_compute_cluster.training_cluster[0].name : ""
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.ml_keyvault.name
}
