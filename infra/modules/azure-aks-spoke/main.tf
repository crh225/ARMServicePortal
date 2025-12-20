# AKS Cluster in Spoke VNet
# This module deploys an AKS cluster with proper networking in a spoke VNet

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.sku_tier

  # Private cluster configuration
  private_cluster_enabled = var.private_cluster_enabled

  # Default node pool with explicit subnet
  default_node_pool {
    name                        = "default"
    vm_size                     = var.default_node_pool_vm_size
    temporary_name_for_rotation = "temppool"
    auto_scaling_enabled        = true
    min_count                   = var.default_node_pool_min_count
    max_count                   = var.default_node_pool_max_count

    # Use the spoke VNet subnet
    vnet_subnet_id = var.vnet_subnet_id

    # Pod subnet for Azure CNI with dynamic IP allocation
    pod_subnet_id = var.pod_subnet_id

    # Availability zones for high availability
    zones = var.availability_zones

    upgrade_settings {
      max_surge = "10%"
    }

    tags = merge(var.tags, {
      "environment" = var.environment
      "nodepool"    = "default"
    })
  }

  # Managed identity
  identity {
    type = var.identity_type
  }

  # Enable OIDC and Workload Identity for Azure AD integration
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # RBAC
  role_based_access_control_enabled = true

  # Azure Policy
  azure_policy_enabled = var.azure_policy_enabled

  # Network profile with explicit configuration
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    service_cidr      = var.service_cidr
    dns_service_ip    = var.dns_service_ip
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"
  }

  # Optional: Azure Monitor integration
  dynamic "oms_agent" {
    for_each = var.log_analytics_workspace_id != null ? [1] : []
    content {
      log_analytics_workspace_id = var.log_analytics_workspace_id
    }
  }

  # Istio Service Mesh add-on
  dynamic "service_mesh_profile" {
    for_each = var.service_mesh_enabled ? [1] : []
    content {
      mode                             = "Istio"
      revisions                        = var.service_mesh_revisions
      internal_ingress_gateway_enabled = var.service_mesh_internal_ingress_enabled
      external_ingress_gateway_enabled = var.service_mesh_external_ingress_enabled
    }
  }

  # Key Vault secrets provider for CSI driver integration
  dynamic "key_vault_secrets_provider" {
    for_each = var.key_vault_secrets_provider_enabled ? [1] : []
    content {
      secret_rotation_enabled = var.key_vault_secret_rotation_enabled
    }
  }

  tags = merge(var.tags, {
    "landing-zone" = "spoke"
    "environment"  = var.environment
    "managed-by"   = "terraform"
  })

  lifecycle {
    ignore_changes = [
      # Ignore changes to node count (managed by autoscaler)
      default_node_pool[0].node_count,
    ]
  }
}

# Role assignment for AKS to pull images and manage network
# Contributor on the subscription for Crossplane (if needed)
resource "azurerm_role_assignment" "aks_network_contributor" {
  scope                = var.vnet_subnet_id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}

# If pod subnet is provided, grant Network Contributor there too
resource "azurerm_role_assignment" "aks_pod_subnet_contributor" {
  count                = var.enable_pod_subnet_role ? 1 : 0
  scope                = var.pod_subnet_id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}
