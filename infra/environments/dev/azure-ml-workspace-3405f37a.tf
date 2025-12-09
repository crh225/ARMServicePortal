module "azure-ml-workspace-3405f37a" {
  source                      = "../../modules/azure-ml-workspace"
  project_name                = "mhd"
  environment                 = "dev"
  resource_group_name         = "test3-dev-rg"
  location                    = "eastus2"
  sku_name                    = "Basic"
  compute_cluster_vm_size     = "Standard_DS2_v2"
  compute_cluster_min_nodes   = "0"
  compute_cluster_max_nodes   = "2"
  compute_cluster_priority    = "LowPriority"
  storage_account_tier        = "Standard"
  storage_account_replication = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-ml-workspace"
    armportal-request-id  = "248"
  }
}

output "azure-ml-workspace-3405f37a_workspace_name" {
  value       = module.azure-ml-workspace-3405f37a.workspace_name
  description = "Azure ML Workspace name"
}
output "azure-ml-workspace-3405f37a_workspace_url" {
  value       = module.azure-ml-workspace-3405f37a.workspace_url
  description = "Azure ML Studio URL"
}
output "azure-ml-workspace-3405f37a_storage_account_name" {
  value       = module.azure-ml-workspace-3405f37a.storage_account_name
  description = "Storage account for ML data"
}
output "azure-ml-workspace-3405f37a_container_registry_login_server" {
  value       = module.azure-ml-workspace-3405f37a.container_registry_login_server
  description = "Container registry for ML models"
}
output "azure-ml-workspace-3405f37a_compute_cluster_name" {
  value       = module.azure-ml-workspace-3405f37a.compute_cluster_name
  description = "Training compute cluster name"
}
output "azure-ml-workspace-3405f37a_key_vault_name" {
  value       = module.azure-ml-workspace-3405f37a.key_vault_name
  description = "Key Vault for secrets"
}