# Management AKS Cluster in Hub VNet
# This cluster runs platform services: Crossplane, ArgoCD, Backstage, ingress controllers

module "aks_mgmt_hub" {
  source = "../../modules/azure-aks-spoke"

  name                = "aks-mgmt-hub"
  resource_group_name = azurerm_resource_group.landing_zone_hub.name
  location            = azurerm_resource_group.landing_zone_hub.location
  environment         = "shared"
  dns_prefix          = "aks-mgmt-hub"

  # Network configuration - use hub VNet subnets
  vnet_subnet_id         = module.hub_vnet.aks_mgmt_nodes_subnet_id
  pod_subnet_id          = module.hub_vnet.aks_mgmt_pods_subnet_id
  enable_pod_subnet_role = true

  # Service CIDR (must not overlap with VNet)
  service_cidr   = "10.100.0.0/16"
  dns_service_ip = "10.100.0.10"

  default_node_pool_vm_size   = "Standard_B2s"
  default_node_pool_min_count = 1
  default_node_pool_max_count = 2
  availability_zones          = null

  # Kubernetes version
  kubernetes_version = "1.32"

  # Public cluster for now (set to true for production)
  private_cluster_enabled = false

  tags = {
    "landing-zone"          = "hub"
    "armportal-environment" = "shared"
    "armportal-blueprint"   = "landing-zone"
    "armportal-cluster"     = "mgmt"
    "purpose"               = "platform-services"
  }
}

# Grant Contributor role for Crossplane Azure resource provisioning
resource "azurerm_role_assignment" "aks_mgmt_contributor" {
  scope                = "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0"
  role_definition_name = "Contributor"
  principal_id         = module.aks_mgmt_hub.identity_principal_id
}

# Outputs for cluster access
output "aks_mgmt_hub_cluster_id" {
  description = "ID of the management AKS cluster"
  value       = module.aks_mgmt_hub.cluster_id
}

output "aks_mgmt_hub_cluster_name" {
  description = "Name of the management AKS cluster"
  value       = module.aks_mgmt_hub.cluster_name
}

output "aks_mgmt_hub_cluster_fqdn" {
  description = "FQDN of the management AKS cluster"
  value       = module.aks_mgmt_hub.cluster_fqdn
}

output "aks_mgmt_hub_kube_config" {
  description = "Kubeconfig for the management AKS cluster"
  value       = module.aks_mgmt_hub.kube_config_raw
  sensitive   = true
}

output "aks_mgmt_hub_oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = module.aks_mgmt_hub.oidc_issuer_url
}

output "aks_mgmt_hub_principal_id" {
  description = "Principal ID of the management cluster identity"
  value       = module.aks_mgmt_hub.identity_principal_id
}
