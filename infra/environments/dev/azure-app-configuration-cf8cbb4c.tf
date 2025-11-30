module "azure-app-configuration-cf8cbb4c" {
  source       = "../../modules/azure-app-configuration"
  project_name = "portal"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  location = "eastus2"
  sku = "free"
  soft_delete_retention_days = "7"
  public_network_access = "Enabled"
  local_auth_enabled = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-app-configuration"
    armportal-request-id  = "185"
  }
}

output "azure-app-configuration-cf8cbb4c_app_configuration_name" {
  value       = module.azure-app-configuration-cf8cbb4c.app_configuration_name
  description = "Name of the App Configuration store"
}
output "azure-app-configuration-cf8cbb4c_endpoint" {
  value       = module.azure-app-configuration-cf8cbb4c.endpoint
  description = "App Configuration endpoint URL"
}
output "azure-app-configuration-cf8cbb4c_primary_read_key" {
  value       = module.azure-app-configuration-cf8cbb4c.primary_read_key
  description = "Primary read-only connection string"
}
output "azure-app-configuration-cf8cbb4c_primary_write_key" {
  value       = module.azure-app-configuration-cf8cbb4c.primary_write_key
  description = "Primary read-write connection string"
}
output "azure-app-configuration-cf8cbb4c_resource_id" {
  value       = module.azure-app-configuration-cf8cbb4c.resource_id
  description = "Azure resource ID"
}