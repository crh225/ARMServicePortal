module "azure-webapp-stack_c551c918_rg" {
  source       = "../../modules/azure-rg-basic"
  project_name = "asdfff"
  environment = "dev"
  location = "eastus2"
}

output "azure-webapp-stack_c551c918_rg_resource_group_name" {
  value       = module.azure-webapp-stack_c551c918_rg.resource_group_name
  description = "The name of the created resource group"
}

module "azure-webapp-stack_c551c918_storage" {
  source       = "../../modules/azure-storage-basic"
  project_name = "asdfff"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_c551c918_rg.resource_group_name"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}

output "azure-webapp-stack_c551c918_storage_storage_account_name" {
  value       = module.azure-webapp-stack_c551c918_storage.storage_account_name
  description = "The name of the created storage account"
}
output "azure-webapp-stack_c551c918_storage_primary_blob_endpoint" {
  value       = module.azure-webapp-stack_c551c918_storage.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}

module "azure-webapp-stack_c551c918_keyvault" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "asdfff"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_c551c918_rg.resource_group_name"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "7"
  purge_protection_enabled = "true"
}

module "azure-webapp-stack_c551c918_app" {
  source       = "../../modules/azure-aci"
  project_name = "asdfff"
  environment = "dev"
  resource_group_name = "module.azure-webapp-stack_c551c918_rg.resource_group_name"
  location = "eastus2"
  container_image = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
  cpu_cores = "1"
  memory_gb = "2"
  port = "80"
  ip_address_type = "Public"
  restart_policy = "Always"
  environment_variables = "{}"
}

output "azure-webapp-stack_c551c918_app_container_group_name" {
  value       = module.azure-webapp-stack_c551c918_app.container_group_name
  description = "Container group name"
}
output "azure-webapp-stack_c551c918_app_fqdn" {
  value       = module.azure-webapp-stack_c551c918_app.fqdn
  description = "Fully qualified domain name (if public IP enabled)"
}
output "azure-webapp-stack_c551c918_app_ip_address" {
  value       = module.azure-webapp-stack_c551c918_app.ip_address
  description = "IP address of the container"
}
output "azure-webapp-stack_c551c918_app_resource_group_name" {
  value       = module.azure-webapp-stack_c551c918_app.resource_group_name
  description = "Resource group name"
}