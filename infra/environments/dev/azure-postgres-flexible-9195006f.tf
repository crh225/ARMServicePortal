module "azure-postgres-flexible-9195006f" {
  source       = "../../modules/azure-postgres-flexible"
  project_name = "backstage"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  location = "eastus2"
  postgres_version = "16"
  sku_name = "B_Standard_B1ms"
  storage_mb = "32768"
  backup_retention_days = "7"
  geo_redundant_backup = "false"
  admin_username = ""
  high_availability_mode = "disabled"
  database_name = "backstagedb"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-postgres-flexible"
    armportal-request-id  = "azure-postgres-flexible-9195006f"
  }
}

output "azure-postgres-flexible-9195006f_server_name" {
  value       = module.azure-postgres-flexible-9195006f.server_name
  description = "PostgreSQL server name"
}
output "azure-postgres-flexible-9195006f_server_fqdn" {
  value       = module.azure-postgres-flexible-9195006f.server_fqdn
  description = "Server fully qualified domain name"
}
output "azure-postgres-flexible-9195006f_database_name" {
  value       = module.azure-postgres-flexible-9195006f.database_name
  description = "Database name"
}
output "azure-postgres-flexible-9195006f_admin_username" {
  value       = module.azure-postgres-flexible-9195006f.admin_username
  description = "Administrator username"
}
output "azure-postgres-flexible-9195006f_admin_password" {
  value       = module.azure-postgres-flexible-9195006f.admin_password
  description = "Administrator password (sensitive)"
  sensitive   = true
}
output "azure-postgres-flexible-9195006f_connection_string" {
  value       = module.azure-postgres-flexible-9195006f.connection_string
  description = "PostgreSQL connection string (sensitive)"
  sensitive   = true
}