module "azure-container-app-5a6a37aa" {
  source       = "../../modules/azure-container-app"
  project_name = "mhd-inference"
  environment = "dev"
  resource_group_name = "test3-dev-rg"
  location = "eastus2"
  container_image = "mlacrmhd364x9k.azurecr.io/mhd-inference:latest"
  cpu_cores = "0.5"
  memory_gb = "1"
  target_port = "8000"
  min_replicas = "0"
  max_replicas = "1"
  ingress_external = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-container-app"
    armportal-request-id  = "250"
  }
}

output "azure-container-app-5a6a37aa_container_app_name" {
  value       = module.azure-container-app-5a6a37aa.container_app_name
  description = "Container App name"
}
output "azure-container-app-5a6a37aa_container_app_environment_name" {
  value       = module.azure-container-app-5a6a37aa.container_app_environment_name
  description = "Container App Environment name"
}
output "azure-container-app-5a6a37aa_fqdn" {
  value       = module.azure-container-app-5a6a37aa.fqdn
  description = "Fully qualified domain name"
}
output "azure-container-app-5a6a37aa_url" {
  value       = module.azure-container-app-5a6a37aa.url
  description = "URL to access the container app"
}
output "azure-container-app-5a6a37aa_resource_group_name" {
  value       = module.azure-container-app-5a6a37aa.resource_group_name
  description = "Resource group name"
}