# Application AKS Cluster in Dev Spoke VNet
# This cluster runs application workloads: Portal, Blog, MHD, webhook-relay

module "aks_app_spoke" {
  source = "../../modules/azure-aks-spoke"

  name                = "aks-app-spoke"
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
  location            = azurerm_resource_group.landing_zone_dev.location
  environment         = "dev"
  dns_prefix          = "aks-app-spoke"

  # Network configuration - use spoke VNet subnets
  vnet_subnet_id         = module.dev_spoke_vnet.aks_nodes_subnet_id
  pod_subnet_id          = module.dev_spoke_vnet.aks_pods_subnet_id
  enable_pod_subnet_role = true

  # Service CIDR (different from mgmt cluster to avoid collision)
  service_cidr   = "10.101.0.0/16"
  dns_service_ip = "10.101.0.10"

  # Node pool configuration
  default_node_pool_vm_size   = "Standard_B2s"
  default_node_pool_min_count = 1
  default_node_pool_max_count = 5
  availability_zones          = ["1", "2", "3"]

  # Kubernetes version
  kubernetes_version = "1.32"

  # Public cluster for now (set to true for production)
  private_cluster_enabled = false

  tags = {
    "landing-zone"          = "spoke"
    "armportal-environment" = "dev"
    "armportal-blueprint"   = "landing-zone"
    "armportal-cluster"     = "app"
    "purpose"               = "application-workloads"
  }
}

# Outputs for cluster access
output "aks_app_spoke_cluster_id" {
  description = "ID of the app spoke AKS cluster"
  value       = module.aks_app_spoke.cluster_id
}

output "aks_app_spoke_cluster_name" {
  description = "Name of the app spoke AKS cluster"
  value       = module.aks_app_spoke.cluster_name
}

output "aks_app_spoke_cluster_fqdn" {
  description = "FQDN of the app spoke AKS cluster"
  value       = module.aks_app_spoke.cluster_fqdn
}

output "aks_app_spoke_kube_config" {
  description = "Kubeconfig for the app spoke AKS cluster"
  value       = module.aks_app_spoke.kube_config_raw
  sensitive   = true
}

output "aks_app_spoke_oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = module.aks_app_spoke.oidc_issuer_url
}

output "aks_app_spoke_principal_id" {
  description = "Principal ID of the app cluster identity"
  value       = module.aks_app_spoke.identity_principal_id
}
