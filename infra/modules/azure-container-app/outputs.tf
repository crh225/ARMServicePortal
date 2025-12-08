output "container_app_name" {
  value       = azurerm_container_app.this.name
  description = "The name of the container app"
}

output "container_app_environment_name" {
  value       = azurerm_container_app_environment.this.name
  description = "The name of the container app environment"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "fqdn" {
  value       = azurerm_container_app.this.latest_revision_fqdn
  description = "Fully qualified domain name of the container app"
}

output "url" {
  value       = "https://${azurerm_container_app.this.latest_revision_fqdn}"
  description = "URL to access the container app"
}
