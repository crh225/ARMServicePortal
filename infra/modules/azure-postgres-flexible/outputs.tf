output "server_name" {
  value       = azurerm_postgresql_flexible_server.this.name
  description = "The name of the PostgreSQL server"
}

output "server_fqdn" {
  value       = azurerm_postgresql_flexible_server.this.fqdn
  description = "The FQDN of the PostgreSQL server"
}

output "database_name" {
  value       = azurerm_postgresql_flexible_server_database.this.name
  description = "The name of the database"
}

output "admin_username" {
  value       = local.admin_username
  description = "The administrator username"
  sensitive   = true
}

output "admin_password" {
  value       = random_password.admin_password.result
  description = "The administrator password"
  sensitive   = true
}

output "connection_string" {
  value       = "postgresql://${local.admin_username}:${random_password.admin_password.result}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
  description = "PostgreSQL connection string"
  sensitive   = true
}
