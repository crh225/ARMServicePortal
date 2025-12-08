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
  description = "Existing resource group where Front Door will be created"
}

variable "origin_hostname" {
  type        = string
  description = "Origin hostname (e.g., storage account static website endpoint)"
}

variable "custom_domain" {
  type        = string
  description = "Custom domain name (e.g., portal.chrishouse.io)"
  default     = null
}

variable "sku_name" {
  type        = string
  description = "Front Door SKU (Standard_AzureFrontDoor or Premium_AzureFrontDoor)"
  default     = "Standard_AzureFrontDoor"
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
