# AKS Cluster for Crossplane
# This cluster hosts Crossplane for Kubernetes-native infrastructure provisioning

resource "azurerm_resource_group" "aks_crossplane" {
  name     = "rg-armportal-aks-crossplane-dev"
  location = "East US"

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose           = "crossplane-demo"
  }
}
resource "azurerm_kubernetes_cluster" "crossplane" {
  name                = "aks-armportal-crossplane-dev"
  location            = azurerm_resource_group.aks_crossplane.location
  resource_group_name = azurerm_resource_group.aks_crossplane.name
  dns_prefix          = "crossplane-dev"

  # Cost-optimized for demo purposes
  # B2s = 2 vCPU, 4GB RAM - sufficient for Crossplane
  default_node_pool {
    name                = "default"
    vm_size             = "Standard_B2s"
    auto_scaling_enabled = true
    min_count           = 3
    max_count           = 4

    tags = {
      environment = "dev"
      purpose     = "crossplane"
    }
  }

  # Use system-assigned managed identity
  # This identity will be used by Crossplane to provision Azure resources
  identity {
    type = "SystemAssigned"
  }

  # Enable OIDC issuer and Workload Identity for Azure AD integration
  # Required for Azure App Configuration feature flags via managed identity
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # Enable RBAC
  role_based_access_control_enabled = true

  # Network settings
  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
    service_cidr   = "10.0.0.0/16"
    dns_service_ip = "10.0.0.10"
  }

  tags = {
    armportal-environment        = "dev"
    purpose            = "crossplane-demo"
    managed_by         = "terraform"
    arm_portal_managed = "true"
    armportal-owner       = "platform-team"
    armportal-request-id  = "PERMANENT"
    armportal-blueprint   = "tfstate-infrastructure"
  }
}

# Assign Contributor role to AKS managed identity for Azure resource provisioning
# This allows Crossplane running in AKS to create Azure resources
resource "azurerm_role_assignment" "aks_crossplane_contributor" {
  scope                = "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0"
  role_definition_name = "Contributor"
  principal_id         = azurerm_kubernetes_cluster.crossplane.identity[0].principal_id
}

# Output the kubeconfig for accessing the cluster
output "aks_crossplane_kubeconfig" {
  value     = azurerm_kubernetes_cluster.crossplane.kube_config_raw
  sensitive = true
}

output "aks_crossplane_name" {
  value = azurerm_kubernetes_cluster.crossplane.name
}

output "aks_crossplane_resource_group" {
  value = azurerm_resource_group.aks_crossplane.name
}

output "aks_crossplane_principal_id" {
  value = azurerm_kubernetes_cluster.crossplane.identity[0].principal_id
}

output "aks_crossplane_oidc_issuer_url" {
  value       = azurerm_kubernetes_cluster.crossplane.oidc_issuer_url
  description = "OIDC issuer URL for Workload Identity federation"
}
