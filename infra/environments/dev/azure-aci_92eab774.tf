module "azure-aci_92eab774" {
  source       = "../../modules/azure-aci"
  project_name = "asdf"
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

output "azure-aci_92eab774_container_group_name" {
  value       = module.azure-aci_92eab774.container_group_name
  description = "Container group name"
}
output "azure-aci_92eab774_fqdn" {
  value       = module.azure-aci_92eab774.fqdn
  description = "Fully qualified domain name (if public IP enabled)"
}
output "azure-aci_92eab774_ip_address" {
  value       = module.azure-aci_92eab774.ip_address
  description = "IP address of the container"
}
output "azure-aci_92eab774_resource_group_name" {
  value       = module.azure-aci_92eab774.resource_group_name
  description = "Resource group name"
}