variable "name" {
  description = "Name of the spoke VNet"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for the spoke VNet"
  type        = string
}

variable "address_space" {
  description = "Address space for the spoke VNet"
  type        = list(string)
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

# Hub VNet information for peering
variable "hub_vnet_id" {
  description = "ID of the hub VNet to peer with"
  type        = string
}

variable "hub_vnet_name" {
  description = "Name of the hub VNet"
  type        = string
}

variable "hub_resource_group_name" {
  description = "Resource group containing the hub VNet"
  type        = string
}

# Subnet configurations
variable "aks_nodes_subnet_prefix" {
  description = "Address prefix for AKS nodes subnet"
  type        = string
}

variable "aks_pods_subnet_prefix" {
  description = "Address prefix for AKS pods subnet (Azure CNI Overlay or dynamic allocation)"
  type        = string
}

variable "private_endpoints_subnet_prefix" {
  description = "Address prefix for private endpoints subnet"
  type        = string
}

variable "ingress_subnet_prefix" {
  description = "Address prefix for ingress/application gateway subnet"
  type        = string
}

variable "dns_servers" {
  description = "Custom DNS servers (empty list uses Azure DNS)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
