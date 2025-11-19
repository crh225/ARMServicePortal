module "azure-aci_ea73c9b0" {
  source       = "../../modules/azure-aci"
  project_name = "test-111925-4"
  environment = "dev"
  resource_group_name = "rg-testpr2-dev-rg"
  location = "eastus2"
  container_image = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
  cpu_cores = "1"
  memory_gb = "1"
  port = "80"
  ip_address_type = "Public"
  restart_policy = "Always"
  environment_variables = "{}"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-aci"
    armportal-request-id  = "azure-aci_ea73c9b0"
  }
}

output "azure-aci_ea73c9b0_container_group_name" {
  value       = module.azure-aci_ea73c9b0.container_group_name
  description = "Container group name"
}
output "azure-aci_ea73c9b0_fqdn" {
  value       = module.azure-aci_ea73c9b0.fqdn
  description = "Fully qualified domain name (if public IP enabled)"
}
output "azure-aci_ea73c9b0_ip_address" {
  value       = module.azure-aci_ea73c9b0.ip_address
  description = "IP address of the container"
}
output "azure-aci_ea73c9b0_resource_group_name" {
  value       = module.azure-aci_ea73c9b0.resource_group_name
  description = "Resource group name"
}