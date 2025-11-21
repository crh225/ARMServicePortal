module "azure-postgres-flexible_810d2a2b" {
  source       = "../../modules/azure-postgres-flexible"
  project_name = "testpostgres"
  environment = "dev"
  resource_group_name = "test3-dev-rg"
  location = "eastus2"
  postgres_version = "16"
  sku_name = "B_Standard_B1ms"
  storage_mb = "32768"
  backup_retention_days = "7"
  geo_redundant_backup = "false"
  admin_username = "psqladminz"
  high_availability_mode = "disabled"
  database_name = "appdb"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-postgres-flexible"
    armportal-request-id  = "azure-postgres-flexible_810d2a2b"
  }
}

output "azure-postgres-flexible_810d2a2b_server_name" {
  value       = module.azure-postgres-flexible_810d2a2b.server_name
  description = "PostgreSQL server name"
}
output "azure-postgres-flexible_810d2a2b_server_fqdn" {
  value       = module.azure-postgres-flexible_810d2a2b.server_fqdn
  description = "Server fully qualified domain name"
}
output "azure-postgres-flexible_810d2a2b_database_name" {
  value       = module.azure-postgres-flexible_810d2a2b.database_name
  description = "Database name"
}
output "azure-postgres-flexible_810d2a2b_admin_username" {
  value       = module.azure-postgres-flexible_810d2a2b.admin_username
  description = "Administrator username"
}
output "azure-postgres-flexible_810d2a2b_admin_password" {
  value       = module.azure-postgres-flexible_810d2a2b.admin_password
  description = "Administrator password (sensitive)"
  sensitive   = true
}
output "azure-postgres-flexible_810d2a2b_connection_string" {
  value       = module.azure-postgres-flexible_810d2a2b.connection_string
  description = "PostgreSQL connection string (sensitive)"
  sensitive   = true
}