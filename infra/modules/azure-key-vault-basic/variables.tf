variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (e.g. dev, prod)"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group where the Key Vault will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the Key Vault"
}

variable "sku_name" {
  type        = string
  description = "Key Vault SKU"
  default     = "standard"
}

variable "soft_delete_retention_days" {
  type        = number
  description = "Soft delete retention in days"
  default     = 7
}

variable "purge_protection_enabled" {
  type        = bool
  description = "Enable purge protection"
  default     = true
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

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for diagnostic settings"
  default     = null
}
