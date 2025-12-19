# Spoke Virtual Network for Landing Zone
# This spoke connects to the central hub via VNet peering

resource "azurerm_virtual_network" "spoke" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.address_space
  dns_servers         = length(var.dns_servers) > 0 ? var.dns_servers : null

  tags = merge(var.tags, {
    "landing-zone" = "spoke"
    "environment"  = var.environment
    "managed-by"   = "terraform"
  })
}

# AKS Nodes Subnet - for AKS node VMs
resource "azurerm_subnet" "aks_nodes" {
  name                 = "AksNodesSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [var.aks_nodes_subnet_prefix]
}

# AKS Pods Subnet - for pod IPs (Azure CNI)
resource "azurerm_subnet" "aks_pods" {
  name                 = "AksPodsSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [var.aks_pods_subnet_prefix]

  # Delegate to AKS for pod networking
  delegation {
    name = "aks-delegation"
    service_delegation {
      name    = "Microsoft.ContainerService/managedClusters"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Private Endpoints Subnet - for Azure PaaS private endpoints
resource "azurerm_subnet" "private_endpoints" {
  name                 = "PrivateEndpointsSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [var.private_endpoints_subnet_prefix]
}

# Ingress Subnet - for Application Gateway or nginx ingress controller
resource "azurerm_subnet" "ingress" {
  name                 = "IngressSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [var.ingress_subnet_prefix]
}

# NSG for AKS Nodes Subnet
resource "azurerm_network_security_group" "aks_nodes" {
  name                = "${var.name}-aks-nodes-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow inbound from hub
  security_rule {
    name                       = "AllowHubInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Allow AKS management traffic
  security_rule {
    name                       = "AllowAzureLoadBalancer"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  tags = merge(var.tags, {
    "landing-zone" = "spoke"
    "environment"  = var.environment
    "managed-by"   = "terraform"
  })
}

# NSG for Private Endpoints Subnet
resource "azurerm_network_security_group" "private_endpoints" {
  name                = "${var.name}-private-endpoints-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow inbound from VNet only
  security_rule {
    name                       = "AllowVNetInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Deny internet inbound
  security_rule {
    name                       = "DenyInternetInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  tags = merge(var.tags, {
    "landing-zone" = "spoke"
    "environment"  = var.environment
    "managed-by"   = "terraform"
  })
}

# NSG for Ingress Subnet
resource "azurerm_network_security_group" "ingress" {
  name                = "${var.name}-ingress-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow HTTP inbound
  security_rule {
    name                       = "AllowHTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow HTTPS inbound
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow Azure Load Balancer
  security_rule {
    name                       = "AllowAzureLoadBalancer"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  tags = merge(var.tags, {
    "landing-zone" = "spoke"
    "environment"  = var.environment
    "managed-by"   = "terraform"
  })
}

# Associate NSGs with subnets
resource "azurerm_subnet_network_security_group_association" "aks_nodes" {
  subnet_id                 = azurerm_subnet.aks_nodes.id
  network_security_group_id = azurerm_network_security_group.aks_nodes.id
}

resource "azurerm_subnet_network_security_group_association" "private_endpoints" {
  subnet_id                 = azurerm_subnet.private_endpoints.id
  network_security_group_id = azurerm_network_security_group.private_endpoints.id
}

resource "azurerm_subnet_network_security_group_association" "ingress" {
  subnet_id                 = azurerm_subnet.ingress.id
  network_security_group_id = azurerm_network_security_group.ingress.id
}

# VNet Peering: Spoke to Hub
resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                         = "${var.name}-to-hub"
  resource_group_name          = var.resource_group_name
  virtual_network_name         = azurerm_virtual_network.spoke.name
  remote_virtual_network_id    = var.hub_vnet_id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

# VNet Peering: Hub to Spoke
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                         = "hub-to-${var.name}"
  resource_group_name          = var.hub_resource_group_name
  virtual_network_name         = var.hub_vnet_name
  remote_virtual_network_id    = azurerm_virtual_network.spoke.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}
