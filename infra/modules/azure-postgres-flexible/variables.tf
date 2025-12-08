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
  description = "Existing resource group where the PostgreSQL server will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the PostgreSQL server"
}

variable "postgres_version" {
  type        = string
  description = "PostgreSQL version"
  default     = "16"
}

variable "sku_name" {
  type        = string
  description = "SKU name for the PostgreSQL server"
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  type        = number
  description = "Storage size in MB"
  default     = 32768
}

variable "backup_retention_days" {
  type        = number
  description = "Backup retention in days"
  default     = 7
}

variable "geo_redundant_backup" {
  type        = bool
  description = "Enable geo-redundant backups"
  default     = false
}

variable "admin_username" {
  type        = string
  description = "Administrator username for PostgreSQL"
  default     = null
}

variable "high_availability_mode" {
  type        = string
  description = "High availability mode (ZoneRedundant or SameZone or disabled)"
  default     = "disabled"
}

variable "database_name" {
  type        = string
  description = "Name of the database to create"
  default     = "appdb"
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
