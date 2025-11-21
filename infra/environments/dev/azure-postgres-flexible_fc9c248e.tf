module "azure-postgres-flexible_fc9c248e" {
  source       = "../../modules/azure-postgres-flexible"
  project_name = "testpostgres-1"
  environment = "dev"
  resource_group_name = "rg-testpr2-dev-rg"
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
    armportal-request-id  = "azure-postgres-flexible_fc9c248e"
  }
}

output "azure-postgres-flexible_fc9c248e_server_name" {
  value       = module.azure-postgres-flexible_fc9c248e.server_name
  description = "PostgreSQL server name"
}
output "azure-postgres-flexible_fc9c248e_server_fqdn" {
  value       = module.azure-postgres-flexible_fc9c248e.server_fqdn
  description = "Server fully qualified domain name"
}
output "azure-postgres-flexible_fc9c248e_database_name" {
  value       = module.azure-postgres-flexible_fc9c248e.database_name
  description = "Database name"
}
output "azure-postgres-flexible_fc9c248e_admin_username" {
  value       = module.azure-postgres-flexible_fc9c248e.admin_username
  description = "Administrator username"
}
output "azure-postgres-flexible_fc9c248e_admin_password" {
  value       = module.azure-postgres-flexible_fc9c248e.admin_password
  description = "Administrator password (sensitive)"
}
output "azure-postgres-flexible_fc9c248e_connection_string" {
  value       = module.azure-postgres-flexible_fc9c248e.connection_string
  description = "PostgreSQL connection string (sensitive)"
}