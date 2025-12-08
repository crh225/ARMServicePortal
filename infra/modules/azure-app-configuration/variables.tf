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
  description = "Existing resource group where the App Configuration will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the App Configuration store"
}

variable "sku" {
  type        = string
  description = "App Configuration SKU (free or standard)"
  default     = "free"
  validation {
    condition     = contains(["free", "standard"], var.sku)
    error_message = "SKU must be 'free' or 'standard'."
  }
}

variable "soft_delete_retention_days" {
  type        = number
  description = "Number of days to retain soft-deleted data"
  default     = 7
}

variable "public_network_access" {
  type        = string
  description = "Public network access setting"
  default     = "Enabled"
  validation {
    condition     = contains(["Enabled", "Disabled"], var.public_network_access)
    error_message = "public_network_access must be 'Enabled' or 'Disabled'."
  }
}

variable "local_auth_enabled" {
  type        = bool
  description = "Enable local authentication (access keys)"
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
