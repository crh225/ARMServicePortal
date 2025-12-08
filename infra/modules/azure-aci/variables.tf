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
  description = "Existing resource group where the container instance will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the container instance"
}

variable "container_image" {
  type        = string
  description = "Container image to deploy (e.g., mcr.microsoft.com/azuredocs/aci-helloworld:latest)"
  default     = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
}

variable "cpu_cores" {
  type        = string
  description = "Number of CPU cores (0.5, 1, 2, 4)"
  default     = "1"
}

variable "memory_gb" {
  type        = string
  description = "Amount of memory in GB (0.5, 1, 2, 4, 8)"
  default     = "1"
}

variable "port" {
  type        = string
  description = "Container port to expose"
  default     = "80"
}

variable "ip_address_type" {
  type        = string
  description = "IP address type: Public, Private, or None"
  default     = "Public"
}

variable "restart_policy" {
  type        = string
  description = "Restart policy: Always, OnFailure, or Never"
  default     = "Always"
}

variable "environment_variables" {
  type        = string
  description = "Environment variables as JSON object (e.g., {\"KEY\":\"value\"})"
  default     = "{}"
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
