# Hub Virtual Network for Landing Zone
# This is the central hub in a hub-and-spoke topology

resource "azurerm_virtual_network" "hub" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.address_space
  dns_servers         = length(var.dns_servers) > 0 ? var.dns_servers : null

  tags = merge(var.tags, {
    "landing-zone" = "hub"
    "managed-by"   = "terraform"
  })
}

# Shared Services Subnet - for DNS, monitoring, jump boxes, etc.
resource "azurerm_subnet" "shared_services" {
  name                 = "SharedServicesSubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.shared_services_subnet_prefix]
}

# Gateway Subnet - reserved for future VPN/ExpressRoute gateway
# Named "GatewaySubnet" as required by Azure for VPN/ER gateways
resource "azurerm_subnet" "gateway" {
  name                 = "GatewaySubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [var.gateway_subnet_prefix]
}

# NSG for Shared Services Subnet
resource "azurerm_network_security_group" "shared_services" {
  name                = "${var.name}-shared-services-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow inbound from spoke VNets (will be updated with spoke CIDRs)
  security_rule {
    name                       = "AllowSpokeInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Deny all other inbound from internet
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
    "landing-zone" = "hub"
    "managed-by"   = "terraform"
  })
}

# Associate NSG with Shared Services Subnet
resource "azurerm_subnet_network_security_group_association" "shared_services" {
  subnet_id                 = azurerm_subnet.shared_services.id
  network_security_group_id = azurerm_network_security_group.shared_services.id
}
