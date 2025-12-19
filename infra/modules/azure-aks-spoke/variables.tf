variable "name" {
  description = "Name of the AKS cluster"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for the AKS cluster"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for the AKS cluster"
  type        = string
}

# Network configuration
variable "vnet_subnet_id" {
  description = "ID of the subnet for AKS nodes"
  type        = string
}

variable "pod_subnet_id" {
  description = "ID of the subnet for AKS pods (for Azure CNI with dynamic IP allocation)"
  type        = string
  default     = null
}

variable "service_cidr" {
  description = "CIDR for Kubernetes services"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dns_service_ip" {
  description = "IP address for Kubernetes DNS service"
  type        = string
  default     = "10.0.0.10"
}

# Node pool configuration
variable "default_node_pool_vm_size" {
  description = "VM size for the default node pool"
  type        = string
  default     = "Standard_B2s"
}

variable "default_node_pool_min_count" {
  description = "Minimum number of nodes in the default node pool"
  type        = number
  default     = 2
}

variable "default_node_pool_max_count" {
  description = "Maximum number of nodes in the default node pool"
  type        = number
  default     = 4
}

variable "kubernetes_version" {
  description = "Kubernetes version (null for latest)"
  type        = string
  default     = null
}

# Security configuration
variable "private_cluster_enabled" {
  description = "Enable private cluster (API server not exposed to internet)"
  type        = bool
  default     = false
}

variable "azure_policy_enabled" {
  description = "Enable Azure Policy add-on"
  type        = bool
  default     = true
}

# Identity
variable "identity_type" {
  description = "Type of identity for the cluster (SystemAssigned or UserAssigned)"
  type        = string
  default     = "SystemAssigned"
}

# Monitoring
variable "log_analytics_workspace_id" {
  description = "ID of Log Analytics workspace for monitoring (optional)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
