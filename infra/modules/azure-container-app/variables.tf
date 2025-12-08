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
  description = "Existing resource group where the container app will be created"
}

variable "location" {
  type        = string
  description = "Azure region for the container app"
}

variable "container_image" {
  type        = string
  description = "Container image to deploy (e.g., myacr.azurecr.io/myapp:latest)"
}

variable "container_registry_server" {
  type        = string
  description = "Container registry server (e.g., myacr.azurecr.io)"
  default     = ""
}

variable "container_registry_username" {
  type        = string
  description = "Container registry username (for private registries)"
  default     = ""
  sensitive   = true
}

variable "container_registry_password" {
  type        = string
  description = "Container registry password (for private registries)"
  default     = ""
  sensitive   = true
}

variable "cpu_cores" {
  type        = string
  description = "Number of CPU cores (0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2)"
  default     = "0.5"
}

variable "memory_gb" {
  type        = string
  description = "Amount of memory in GB (0.5, 1, 1.5, 2, 3, 4)"
  default     = "1"
}

variable "target_port" {
  type        = number
  description = "Container port that receives traffic"
  default     = 8000
}

variable "min_replicas" {
  type        = number
  description = "Minimum number of replicas"
  default     = 0
}

variable "max_replicas" {
  type        = number
  description = "Maximum number of replicas"
  default     = 3
}

variable "ingress_external" {
  type        = bool
  description = "Allow external ingress (public access)"
  default     = true
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
