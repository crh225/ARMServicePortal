module "azure-app-configuration-9cd7eeaa" {
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
    armportal-request-id  = "187"
  }
}

output "azure-app-configuration-9cd7eeaa_app_configuration_name" {
  value       = module.azure-app-configuration-9cd7eeaa.app_configuration_name
  description = "Name of the App Configuration store"
}
output "azure-app-configuration-9cd7eeaa_endpoint" {
  value       = module.azure-app-configuration-9cd7eeaa.endpoint
  description = "App Configuration endpoint URL"
}
output "azure-app-configuration-9cd7eeaa_primary_read_key" {
  value       = module.azure-app-configuration-9cd7eeaa.primary_read_key
  description = "Primary read-only connection string"
  sensitive   = true
}
output "azure-app-configuration-9cd7eeaa_primary_write_key" {
  value       = module.azure-app-configuration-9cd7eeaa.primary_write_key
  description = "Primary read-write connection string"
  sensitive   = true
}
output "azure-app-configuration-9cd7eeaa_resource_id" {
  value       = module.azure-app-configuration-9cd7eeaa.resource_id
  description = "Azure resource ID"
}