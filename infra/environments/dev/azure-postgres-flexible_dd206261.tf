module "azure-postgres-flexible_dd206261" {
  source       = "../../modules/azure-postgres-flexible"
  project_name = "testpostz"
  environment = "dev"
  resource_group_name = "test99zzz-dev-rg"
  location = "eastus"
  postgres_version = "16"
  sku_name = "B_Standard_B1ms"
  storage_mb = "32768"
  backup_retention_days = "7"
  geo_redundant_backup = "false"
  admin_username = ""
  high_availability_mode = "disabled"
  database_name = "appdb"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-postgres-flexible"
    armportal-request-id  = "azure-postgres-flexible_dd206261"
  }
}

output "azure-postgres-flexible_dd206261_server_name" {
  value       = module.azure-postgres-flexible_dd206261.server_name
  description = "PostgreSQL server name"
}
output "azure-postgres-flexible_dd206261_server_fqdn" {
  value       = module.azure-postgres-flexible_dd206261.server_fqdn
  description = "Server fully qualified domain name"
}
output "azure-postgres-flexible_dd206261_database_name" {
  value       = module.azure-postgres-flexible_dd206261.database_name
  description = "Database name"
}
output "azure-postgres-flexible_dd206261_admin_username" {
  value       = module.azure-postgres-flexible_dd206261.admin_username
  description = "Administrator username"
}
output "azure-postgres-flexible_dd206261_admin_password" {
  value       = module.azure-postgres-flexible_dd206261.admin_password
  description = "Administrator password (sensitive)"
  sensitive   = true
}
output "azure-postgres-flexible_dd206261_connection_string" {
  value       = module.azure-postgres-flexible_dd206261.connection_string
  description = "PostgreSQL connection string (sensitive)"
  sensitive   = true
}