# Dev Spoke VNet for Landing Zone
# This spoke connects to the hub and hosts dev workloads

resource "azurerm_resource_group" "landing_zone_dev" {
  name     = "rg-landing-zone-dev"
  location = "East US"

  tags = {
    "landing-zone"          = "spoke"
    "managed-by"            = "terraform"
    "armportal-environment" = "dev"
    "armportal-blueprint"   = "landing-zone"
  }
}

module "dev_spoke_vnet" {
  source = "../../modules/azure-vnet-spoke"

  name                = "vnet-spoke-dev"
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
  location            = azurerm_resource_group.landing_zone_dev.location
  address_space       = ["10.1.0.0/16"]
  environment         = "dev"

  # Subnet prefixes
  aks_nodes_subnet_prefix         = "10.1.0.0/22"
  aks_pods_subnet_prefix          = "10.1.4.0/22"
  private_endpoints_subnet_prefix = "10.1.8.0/24"
  ingress_subnet_prefix           = "10.1.9.0/24"

  # Hub VNet for peering
  hub_vnet_id             = module.hub_vnet.vnet_id
  hub_vnet_name           = module.hub_vnet.vnet_name
  hub_resource_group_name = azurerm_resource_group.landing_zone_hub.name

  tags = {
    "landing-zone"          = "spoke"
    "armportal-environment" = "dev"
    "armportal-blueprint"   = "landing-zone"
  }
}

# Outputs for use by AKS and other resources
output "dev_spoke_vnet_id" {
  description = "ID of the dev spoke VNet"
  value       = module.dev_spoke_vnet.vnet_id
}

output "dev_spoke_vnet_name" {
  description = "Name of the dev spoke VNet"
  value       = module.dev_spoke_vnet.vnet_name
}

output "dev_spoke_resource_group_name" {
  description = "Resource group containing the dev spoke VNet"
  value       = azurerm_resource_group.landing_zone_dev.name
}

output "dev_aks_nodes_subnet_id" {
  description = "ID of the AKS nodes subnet in dev spoke"
  value       = module.dev_spoke_vnet.aks_nodes_subnet_id
}

output "dev_aks_pods_subnet_id" {
  description = "ID of the AKS pods subnet in dev spoke"
  value       = module.dev_spoke_vnet.aks_pods_subnet_id
}

output "dev_private_endpoints_subnet_id" {
  description = "ID of the private endpoints subnet in dev spoke"
  value       = module.dev_spoke_vnet.private_endpoints_subnet_id
}

output "dev_ingress_subnet_id" {
  description = "ID of the ingress subnet in dev spoke"
  value       = module.dev_spoke_vnet.ingress_subnet_id
}
