output "app_configuration_name" {
  value       = azurerm_app_configuration.this.name
  description = "Name of the App Configuration store"
}

output "endpoint" {
  value       = azurerm_app_configuration.this.endpoint
  description = "App Configuration endpoint URL"
}

output "primary_read_key" {
  value       = var.local_auth_enabled ? azurerm_app_configuration.this.primary_read_key[0].connection_string : null
  description = "Primary read-only connection string"
  sensitive   = true
}

output "primary_write_key" {
  value       = var.local_auth_enabled ? azurerm_app_configuration.this.primary_write_key[0].connection_string : null
  description = "Primary read-write connection string"
  sensitive   = true
}

output "resource_id" {
  value       = azurerm_app_configuration.this.id
  description = "Azure resource ID"
}
