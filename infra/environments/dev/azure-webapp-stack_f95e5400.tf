module "azure-webapp-stack_f95e5400" {
  source       = "undefined"
  project_name = "asdfz"
  environment = "dev"
  location = "eastus2"
  container_image = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
  cpu_cores = "0.5"
  memory_gb = "1"
  container_port = "80"
  keyvault_sku = "standard"
  environment_variables = "{}"
}

output "azure-webapp-stack_f95e5400_resource_group_name" {
  value       = module.azure-webapp-stack_f95e5400.resource_group_name
  description = "Resource group name"
}
output "azure-webapp-stack_f95e5400_storage_account_name" {
  value       = module.azure-webapp-stack_f95e5400.storage_account_name
  description = "Storage account name"
}
output "azure-webapp-stack_f95e5400_container_fqdn" {
  value       = module.azure-webapp-stack_f95e5400.container_fqdn
  description = "Container FQDN"
}
output "azure-webapp-stack_f95e5400_container_ip" {
  value       = module.azure-webapp-stack_f95e5400.container_ip
  description = "Container IP address"
}