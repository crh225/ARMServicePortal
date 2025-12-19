output "cluster_id" {
  description = "ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.id
}

output "cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.name
}

output "cluster_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.fqdn
}

output "private_fqdn" {
  description = "Private FQDN of the AKS cluster (if private cluster enabled)"
  value       = azurerm_kubernetes_cluster.aks.private_fqdn
}

output "kube_config_raw" {
  description = "Raw kubeconfig for the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}

output "kube_config_host" {
  description = "Kubernetes API server host"
  value       = azurerm_kubernetes_cluster.aks.kube_config[0].host
  sensitive   = true
}

output "kube_config_client_certificate" {
  description = "Client certificate for Kubernetes authentication"
  value       = azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate
  sensitive   = true
}

output "kube_config_client_key" {
  description = "Client key for Kubernetes authentication"
  value       = azurerm_kubernetes_cluster.aks.kube_config[0].client_key
  sensitive   = true
}

output "kube_config_cluster_ca_certificate" {
  description = "Cluster CA certificate for Kubernetes authentication"
  value       = azurerm_kubernetes_cluster.aks.kube_config[0].cluster_ca_certificate
  sensitive   = true
}

output "identity_principal_id" {
  description = "Principal ID of the AKS managed identity"
  value       = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}

output "identity_tenant_id" {
  description = "Tenant ID of the AKS managed identity"
  value       = azurerm_kubernetes_cluster.aks.identity[0].tenant_id
}

output "kubelet_identity_object_id" {
  description = "Object ID of the kubelet identity"
  value       = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}

output "kubelet_identity_client_id" {
  description = "Client ID of the kubelet identity"
  value       = azurerm_kubernetes_cluster.aks.kubelet_identity[0].client_id
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for Workload Identity federation"
  value       = azurerm_kubernetes_cluster.aks.oidc_issuer_url
}

output "node_resource_group" {
  description = "Resource group containing the AKS node resources"
  value       = azurerm_kubernetes_cluster.aks.node_resource_group
}

output "resource_group_name" {
  description = "Resource group containing the AKS cluster"
  value       = var.resource_group_name
}

output "location" {
  description = "Location of the AKS cluster"
  value       = var.location
}
