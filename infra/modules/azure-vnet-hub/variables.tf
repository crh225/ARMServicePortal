variable "name" {
  description = "Name of the hub VNet"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for the hub VNet"
  type        = string
}

variable "address_space" {
  description = "Address space for the hub VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "shared_services_subnet_prefix" {
  description = "Address prefix for shared services subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "gateway_subnet_prefix" {
  description = "Address prefix for gateway subnet (reserved for future VPN/ExpressRoute)"
  type        = string
  default     = "10.0.255.0/27"
}

variable "dns_servers" {
  description = "Custom DNS servers (empty list uses Azure DNS)"
  type        = list(string)
  default     = []
}

variable "aks_mgmt_nodes_subnet_prefix" {
  description = "Address prefix for AKS management cluster nodes subnet"
  type        = string
  default     = "10.0.2.0/23"
}

variable "aks_mgmt_pods_subnet_prefix" {
  description = "Address prefix for AKS management cluster pods subnet (Azure CNI)"
  type        = string
  default     = "10.0.4.0/22"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
