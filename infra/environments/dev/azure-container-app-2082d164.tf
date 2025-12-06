module "azure-container-app-2082d164" {
  source       = "../../modules/azure-container-app"
  project_name = "mhd-inference"
  environment = "dev"
  resource_group_name = "test3-dev-rg"
  location = "eastus2"
  container_image = "mlacrmhd364x9k.azurecr.io/mhd-inference:latest"
  container_registry_server = ""
  cpu_cores = "0.25"
  memory_gb = "0.5"
  target_port = "8000"
  min_replicas = "0"
  max_replicas = "1"
  ingress_external = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-container-app"
    armportal-request-id  = "251"
  }
}

output "azure-container-app-2082d164_container_app_name" {
  value       = module.azure-container-app-2082d164.container_app_name
  description = "Container App name"
}
output "azure-container-app-2082d164_container_app_environment_name" {
  value       = module.azure-container-app-2082d164.container_app_environment_name
  description = "Container App Environment name"
}
output "azure-container-app-2082d164_fqdn" {
  value       = module.azure-container-app-2082d164.fqdn
  description = "Fully qualified domain name"
}
output "azure-container-app-2082d164_url" {
  value       = module.azure-container-app-2082d164.url
  description = "URL to access the container app"
}
output "azure-container-app-2082d164_resource_group_name" {
  value       = module.azure-container-app-2082d164.resource_group_name
  description = "Resource group name"
}