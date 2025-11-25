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

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
  default     = ""
}

variable "elk_version" {
  description = "ELK stack version"
  type        = string
  default     = "8.11.0"
}

variable "elasticsearch_cpu" {
  description = "CPU cores for Elasticsearch container"
  type        = number
  default     = 2
}

variable "elasticsearch_memory" {
  description = "Memory in GB for Elasticsearch container"
  type        = number
  default     = 4
}

variable "elasticsearch_heap_size" {
  description = "JVM heap size for Elasticsearch"
  type        = string
  default     = "2g"
}

variable "elasticsearch_storage_gb" {
  description = "Storage size in GB for Elasticsearch data"
  type        = number
  default     = 50
}

variable "logstash_cpu" {
  description = "CPU cores for Logstash container"
  type        = number
  default     = 1
}

variable "logstash_memory" {
  description = "Memory in GB for Logstash container"
  type        = number
  default     = 2
}

variable "logstash_heap_size" {
  description = "JVM heap size for Logstash"
  type        = string
  default     = "1g"
}

variable "kibana_cpu" {
  description = "CPU cores for Kibana container"
  type        = number
  default     = 1
}

variable "kibana_memory" {
  description = "Memory in GB for Kibana container"
  type        = number
  default     = 4
}

variable "create_nsg" {
  description = "Whether to create a Network Security Group"
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access the ELK stack"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
