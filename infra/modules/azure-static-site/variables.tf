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
  description = "Existing resource group where the storage account will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the storage account"
}

variable "index_document" {
  type        = string
  description = "Index document for the static website"
  default     = "index.html"
}

variable "error_document" {
  type        = string
  description = "Error document for the static website"
  default     = "404.html"
}

variable "enable_cdn" {
  type        = string
  description = "Enable Azure CDN for the static website (true/false)"
  default     = "false"
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
