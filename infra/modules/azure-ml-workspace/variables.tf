variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (dev, prod)"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "eastus2"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to resources"
  default     = {}
}

variable "request_id" {
  type        = string
  description = "ARM Portal request ID (PR number)"
  default     = null
}

variable "owner" {
  type        = string
  description = "ARM Portal owner"
  default     = "crh225"
}

variable "sku_name" {
  type        = string
  description = "SKU for Azure ML Workspace"
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Enterprise"], var.sku_name)
    error_message = "SKU must be Basic or Enterprise."
  }
}

variable "storage_account_tier" {
  type        = string
  description = "Storage account tier for ML data"
  default     = "Standard"
}

variable "storage_account_replication" {
  type        = string
  description = "Storage account replication type"
  default     = "LRS"
}

variable "compute_cluster_vm_size" {
  type        = string
  description = "VM size for compute cluster"
  default     = "Standard_DS2_v2"
}

variable "compute_cluster_min_nodes" {
  type        = number
  description = "Minimum nodes in compute cluster (set to 0 to save costs)"
  default     = 0
}

variable "compute_cluster_max_nodes" {
  type        = number
  description = "Maximum nodes in compute cluster"
  default     = 2
}

variable "compute_cluster_priority" {
  type        = string
  description = "VM priority (LowPriority for cost savings, Dedicated for reliability)"
  default     = "LowPriority"
}

variable "create_compute_cluster" {
  type        = bool
  description = "Whether to create the compute cluster (requires vCPU quota - check your subscription limits)"
  default     = false
}
