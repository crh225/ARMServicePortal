# Management AKS Cluster in Dev Spoke VNet
# This is the management control plane for future workloads

module "aks_dev_spoke" {
  source = "../../modules/azure-aks-spoke"

  name                = "aks-dev-spoke"
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
  location            = azurerm_resource_group.landing_zone_dev.location
  environment         = "dev"
  dns_prefix          = "aks-dev-spoke"

  # Network configuration - use spoke VNet subnets
  vnet_subnet_id = module.dev_spoke_vnet.aks_nodes_subnet_id
  pod_subnet_id  = module.dev_spoke_vnet.aks_pods_subnet_id

  # Service CIDR (must not overlap with VNet)
  service_cidr   = "10.100.0.0/16"
  dns_service_ip = "10.100.0.10"

  # Node pool configuration 
  default_node_pool_vm_size   = "Standard_B2s"
  default_node_pool_min_count = 1
  default_node_pool_max_count = 3
  availability_zones          = ["1", "2", "3"]

  # Kubernetes version
  kubernetes_version = "1.32"

  # Optional: Make private cluster (set to true for production)
  private_cluster_enabled = false

  tags = {
    "landing-zone"          = "spoke"
    "armportal-environment" = "dev"
    "armportal-blueprint"   = "landing-zone"
    "armportal-cluster"     = "spoke"
  }
}

# Outputs for cluster access
output "aks_dev_spoke_cluster_id" {
  description = "ID of the dev spoke AKS cluster"
  value       = module.aks_dev_spoke.cluster_id
}

output "aks_dev_spoke_cluster_name" {
  description = "Name of the dev spoke AKS cluster"
  value       = module.aks_dev_spoke.cluster_name
}

output "aks_dev_spoke_cluster_fqdn" {
  description = "FQDN of the dev spoke AKS cluster"
  value       = module.aks_dev_spoke.cluster_fqdn
}

output "aks_dev_spoke_kube_config" {
  description = "Kubeconfig for the dev spoke AKS cluster"
  value       = module.aks_dev_spoke.kube_config_raw
  sensitive   = true
}

output "aks_dev_spoke_oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = module.aks_dev_spoke.oidc_issuer_url
}
