module "azure-aci_9633b6fa" {
  source       = "../../modules/azure-aci"
  project_name = "test1b"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  container_image = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
  cpu_cores = "1"
  memory_gb = "1"
  port = "80"
  ip_address_type = "Public"
  restart_policy = "Always"
  environment_variables = "{}"
}

output "azure-aci_9633b6fa_container_group_name" {
  value       = module.azure-aci_9633b6fa.container_group_name
  description = "Container group name"
}
output "azure-aci_9633b6fa_fqdn" {
  value       = module.azure-aci_9633b6fa.fqdn
  description = "Fully qualified domain name (if public IP enabled)"
}
output "azure-aci_9633b6fa_ip_address" {
  value       = module.azure-aci_9633b6fa.ip_address
  description = "IP address of the container"
}
output "azure-aci_9633b6fa_resource_group_name" {
  value       = module.azure-aci_9633b6fa.resource_group_name
  description = "Resource group name"
}