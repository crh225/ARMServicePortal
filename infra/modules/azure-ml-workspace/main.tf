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
