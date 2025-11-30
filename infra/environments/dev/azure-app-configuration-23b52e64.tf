module "azure-app-configuration-23b52e64" {
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
    armportal-request-id  = "183"
  }
}

output "azure-app-configuration-23b52e64_app_configuration_name" {
  value       = module.azure-app-configuration-23b52e64.app_configuration_name
  description = "Name of the App Configuration store"
}
output "azure-app-configuration-23b52e64_endpoint" {
  value       = module.azure-app-configuration-23b52e64.endpoint
  description = "App Configuration endpoint URL"
}
output "azure-app-configuration-23b52e64_primary_read_key" {
  value       = module.azure-app-configuration-23b52e64.primary_read_key
  description = "Primary read-only connection string"
}
output "azure-app-configuration-23b52e64_primary_write_key" {
  value       = module.azure-app-configuration-23b52e64.primary_write_key
  description = "Primary read-write connection string"
}
output "azure-app-configuration-23b52e64_resource_id" {
  value       = module.azure-app-configuration-23b52e64.resource_id
  description = "Azure resource ID"
}