variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "sku_name" {
  description = "SKU for Elastic deployment (ess-consumption-2024_Monthly, etc)"
  type        = string
  default     = "ess-consumption-2024_Monthly"
}

variable "elastic_email" {
  description = "Email address for Elastic Cloud account"
  type        = string
}

variable "monitoring_enabled" {
  description = "Enable monitoring for the Elastic deployment"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
