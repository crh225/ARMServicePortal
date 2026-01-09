# Hub VNet for Landing Zone
# This is the central hub shared across all environments

resource "azurerm_resource_group" "landing_zone_hub" {
  name     = "rg-landing-zone-hub"
  location = "East US"

  tags = {
    "landing-zone"          = "hub"
    "managed-by"            = "terraform"
    "armportal-environment" = "shared"
    "armportal-blueprint"   = "landing-zone"
  }
}

module "hub_vnet" {
  source = "../../modules/azure-vnet-hub"

  name                          = "vnet-hub-eastus"
  resource_group_name           = azurerm_resource_group.landing_zone_hub.name
  location                      = azurerm_resource_group.landing_zone_hub.location
  address_space                 = ["10.0.0.0/16"]
  shared_services_subnet_prefix = "10.0.1.0/24"
  gateway_subnet_prefix         = "10.0.255.0/27"

  # AKS Management Cluster subnets
  aks_mgmt_nodes_subnet_prefix = "10.0.2.0/23"
  aks_mgmt_pods_subnet_prefix  = "10.0.4.0/22"

  tags = {
    "landing-zone"          = "hub"
    "armportal-environment" = "shared"
    "armportal-blueprint"   = "landing-zone"
  }
}

# Outputs for use by spoke VNets
output "hub_vnet_id" {
  description = "ID of the hub VNet"
  value       = module.hub_vnet.vnet_id
}

output "hub_vnet_name" {
  description = "Name of the hub VNet"
  value       = module.hub_vnet.vnet_name
}

output "hub_resource_group_name" {
  description = "Resource group containing the hub VNet"
  value       = azurerm_resource_group.landing_zone_hub.name
}

output "hub_shared_services_subnet_id" {
  description = "ID of the hub shared services subnet"
  value       = module.hub_vnet.shared_services_subnet_id
}

output "hub_aks_mgmt_nodes_subnet_id" {
  description = "ID of the AKS management cluster nodes subnet in hub"
  value       = module.hub_vnet.aks_mgmt_nodes_subnet_id
}

output "hub_aks_mgmt_pods_subnet_id" {
  description = "ID of the AKS management cluster pods subnet in hub"
  value       = module.hub_vnet.aks_mgmt_pods_subnet_id
}

# ARM Portal Backend Managed Identity
# Used for workload identity federation with AKS and Key Vault access
resource "azurerm_user_assigned_identity" "armportal_backend" {
  name                = "armportal-backend-identity"
  resource_group_name = azurerm_resource_group.landing_zone_hub.name
  location            = azurerm_resource_group.landing_zone_hub.location

  tags = {
    "purpose"               = "armportal-backend"
    "managed-by"            = "terraform"
    "armportal-environment" = "shared"
  }
}

output "armportal_backend_identity_id" {
  description = "ID of the ARM Portal backend managed identity"
  value       = azurerm_user_assigned_identity.armportal_backend.id
}

output "armportal_backend_identity_client_id" {
  description = "Client ID of the ARM Portal backend managed identity"
  value       = azurerm_user_assigned_identity.armportal_backend.client_id
}

output "armportal_backend_identity_principal_id" {
  description = "Principal ID of the ARM Portal backend managed identity"
  value       = azurerm_user_assigned_identity.armportal_backend.principal_id
}
