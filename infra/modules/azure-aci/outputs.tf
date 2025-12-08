output "container_group_name" {
  value       = azurerm_container_group.this.name
  description = "The name of the container group"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "fqdn" {
  value       = local.enable_ip && var.ip_address_type == "Public" ? azurerm_container_group.this.fqdn : ""
  description = "Fully qualified domain name (only for public IP)"
}

output "ip_address" {
  value       = local.enable_ip ? azurerm_container_group.this.ip_address : ""
  description = "IP address of the container group"
}
