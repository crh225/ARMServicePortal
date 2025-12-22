# West US 2 Spoke VNet for Landing Zone
# This spoke connects to the hub and hosts team ephemeral clusters outside East US quota

module "westus2_spoke_vnet" {
  source = "../../modules/azure-vnet-spoke"

  name                = "vnet-spoke-westus2"
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
  location            = "West US 2"
  address_space       = ["10.103.0.0/16"]
  environment         = "dev"

  # Subnet prefixes
  aks_nodes_subnet_prefix         = "10.103.0.0/22"
  aks_pods_subnet_prefix          = "10.103.4.0/22"
  private_endpoints_subnet_prefix = "10.103.8.0/24"
  ingress_subnet_prefix           = "10.103.9.0/24"

  # Hub VNet for peering
  hub_vnet_id             = module.hub_vnet.vnet_id
  hub_vnet_name           = module.hub_vnet.vnet_name
  hub_resource_group_name = azurerm_resource_group.landing_zone_hub.name

  tags = {
    "landing-zone"          = "spoke"
    "armportal-environment" = "dev"
    "armportal-blueprint"   = "landing-zone"
    "region"                = "westus2"
  }
}

# Outputs for use by AKS and other resources
output "westus2_spoke_vnet_id" {
  description = "ID of the West US 2 spoke VNet"
  value       = module.westus2_spoke_vnet.vnet_id
}

output "westus2_spoke_vnet_name" {
  description = "Name of the West US 2 spoke VNet"
  value       = module.westus2_spoke_vnet.vnet_name
}

output "westus2_aks_nodes_subnet_id" {
  description = "ID of the AKS nodes subnet in West US 2 spoke"
  value       = module.westus2_spoke_vnet.aks_nodes_subnet_id
}

output "westus2_aks_pods_subnet_id" {
  description = "ID of the AKS pods subnet in West US 2 spoke"
  value       = module.westus2_spoke_vnet.aks_pods_subnet_id
}

output "westus2_private_endpoints_subnet_id" {
  description = "ID of the private endpoints subnet in West US 2 spoke"
  value       = module.westus2_spoke_vnet.private_endpoints_subnet_id
}

output "westus2_ingress_subnet_id" {
  description = "ID of the ingress subnet in West US 2 spoke"
  value       = module.westus2_spoke_vnet.ingress_subnet_id
}
