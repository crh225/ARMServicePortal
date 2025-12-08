variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (e.g. dev, qa, staging, prod)"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group where the Function App will be created"
}

variable "location" {
  type        = string
  description = "Azure region for resources"
}

variable "runtime_stack" {
  type        = string
  description = "Runtime stack for the Function App"
  default     = "node"
  validation {
    condition     = contains(["node", "dotnet", "python", "java", "powershell"], var.runtime_stack)
    error_message = "Runtime stack must be one of: node, dotnet, python, java, powershell."
  }
}

variable "runtime_version" {
  type        = string
  description = "Version of the runtime stack"
  default     = "20"
}

variable "os_type" {
  type        = string
  description = "Operating system type (Linux or Windows)"
  default     = "Linux"
  validation {
    condition     = contains(["Linux", "Windows"], var.os_type)
    error_message = "OS type must be 'Linux' or 'Windows'."
  }
}

variable "sku_name" {
  type        = string
  description = "SKU for the App Service Plan"
  default     = "Y1"
  validation {
    condition     = contains(["Y1", "EP1", "EP2", "EP3", "B1", "B2", "B3", "S1", "S2", "S3", "P1v2", "P2v2", "P3v2", "P1v3", "P2v3", "P3v3"], var.sku_name)
    error_message = "SKU must be a valid App Service Plan SKU."
  }
}

variable "always_on" {
  type        = bool
  description = "Whether the Function App should always be running (not available for Consumption plan)"
  default     = false
}

variable "app_settings" {
  type        = map(string)
  description = "Additional application settings"
  default     = {}
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
