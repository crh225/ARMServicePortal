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
  description = "Existing resource group where the storage account will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the storage account"
}

variable "account_tier" {
  type        = string
  description = "Storage account tier"
  default     = "Standard"
}

variable "replication_type" {
  type        = string
  description = "Replication strategy"
  default     = "LRS"
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
