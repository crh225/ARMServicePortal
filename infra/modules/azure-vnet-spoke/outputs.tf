output "vnet_id" {
  description = "ID of the spoke VNet"
  value       = azurerm_virtual_network.spoke.id
}

output "vnet_name" {
  description = "Name of the spoke VNet"
  value       = azurerm_virtual_network.spoke.name
}

output "vnet_address_space" {
  description = "Address space of the spoke VNet"
  value       = azurerm_virtual_network.spoke.address_space
}

output "aks_nodes_subnet_id" {
  description = "ID of the AKS nodes subnet"
  value       = azurerm_subnet.aks_nodes.id
}

output "aks_nodes_subnet_name" {
  description = "Name of the AKS nodes subnet"
  value       = azurerm_subnet.aks_nodes.name
}

output "aks_pods_subnet_id" {
  description = "ID of the AKS pods subnet"
  value       = azurerm_subnet.aks_pods.id
}

output "aks_pods_subnet_name" {
  description = "Name of the AKS pods subnet"
  value       = azurerm_subnet.aks_pods.name
}

output "private_endpoints_subnet_id" {
  description = "ID of the private endpoints subnet"
  value       = azurerm_subnet.private_endpoints.id
}

output "private_endpoints_subnet_name" {
  description = "Name of the private endpoints subnet"
  value       = azurerm_subnet.private_endpoints.name
}

output "ingress_subnet_id" {
  description = "ID of the ingress subnet"
  value       = azurerm_subnet.ingress.id
}

output "ingress_subnet_name" {
  description = "Name of the ingress subnet"
  value       = azurerm_subnet.ingress.name
}

output "resource_group_name" {
  description = "Resource group name containing the spoke VNet"
  value       = var.resource_group_name
}

output "location" {
  description = "Location of the spoke VNet"
  value       = var.location
}

output "environment" {
  description = "Environment of this spoke"
  value       = var.environment
}
