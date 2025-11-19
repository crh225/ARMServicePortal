module "azure-webapp-stack_5b0d160a_rg" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-11-19-2025-platform"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-webapp-stack_5b0d160a_rg"
  }
}

output "azure-webapp-stack_5b0d160a_rg_resource_group_name" {
  value       = module.azure-webapp-stack_5b0d160a_rg.resource_group_name
  description = "The name of the created resource group"
}

module "azure-webapp-stack_5b0d160a_storage" {
  source       = "../../modules/azure-storage-basic"
  project_name = "test-11-19-2025-platform"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_5b0d160a_rg.resource_group_name"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "azure-webapp-stack_5b0d160a_storage"
  }
}

output "azure-webapp-stack_5b0d160a_storage_storage_account_name" {
  value       = module.azure-webapp-stack_5b0d160a_storage.storage_account_name
  description = "The name of the created storage account"
}
output "azure-webapp-stack_5b0d160a_storage_primary_blob_endpoint" {
  value       = module.azure-webapp-stack_5b0d160a_storage.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}

module "azure-webapp-stack_5b0d160a_keyvault" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "test-11-19-2025-platform"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_5b0d160a_rg.resource_group_name"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "7"
  purge_protection_enabled = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-key-vault-basic"
    armportal-request-id  = "azure-webapp-stack_5b0d160a_keyvault"
  }
}

module "azure-webapp-stack_5b0d160a_app" {
  source       = "../../modules/azure-aci"
  project_name = "test-11-19-2025-platform"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_5b0d160a_rg.resource_group_name"
  location = "eastus2"
  container_image = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
  cpu_cores = "0.5"
  memory_gb = "1"
  port = "80"
  ip_address_type = "Public"
  restart_policy = "Always"
  environment_variables = "{}"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-aci"
    armportal-request-id  = "azure-webapp-stack_5b0d160a_app"
  }
}

output "azure-webapp-stack_5b0d160a_app_container_group_name" {
  value       = module.azure-webapp-stack_5b0d160a_app.container_group_name
  description = "Container group name"
}
output "azure-webapp-stack_5b0d160a_app_fqdn" {
  value       = module.azure-webapp-stack_5b0d160a_app.fqdn
  description = "Fully qualified domain name (if public IP enabled)"
}
output "azure-webapp-stack_5b0d160a_app_ip_address" {
  value       = module.azure-webapp-stack_5b0d160a_app.ip_address
  description = "IP address of the container"
}
output "azure-webapp-stack_5b0d160a_app_resource_group_name" {
  value       = module.azure-webapp-stack_5b0d160a_app.resource_group_name
  description = "Resource group name"
}