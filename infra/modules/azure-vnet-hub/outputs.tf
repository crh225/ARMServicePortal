output "vnet_id" {
  description = "ID of the hub VNet"
  value       = azurerm_virtual_network.hub.id
}

output "vnet_name" {
  description = "Name of the hub VNet"
  value       = azurerm_virtual_network.hub.name
}

output "vnet_address_space" {
  description = "Address space of the hub VNet"
  value       = azurerm_virtual_network.hub.address_space
}

output "shared_services_subnet_id" {
  description = "ID of the shared services subnet"
  value       = azurerm_subnet.shared_services.id
}

output "shared_services_subnet_name" {
  description = "Name of the shared services subnet"
  value       = azurerm_subnet.shared_services.name
}

output "gateway_subnet_id" {
  description = "ID of the gateway subnet"
  value       = azurerm_subnet.gateway.id
}

output "gateway_subnet_name" {
  description = "Name of the gateway subnet"
  value       = azurerm_subnet.gateway.name
}

output "resource_group_name" {
  description = "Resource group name containing the hub VNet"
  value       = var.resource_group_name
}

output "location" {
  description = "Location of the hub VNet"
  value       = var.location
}
