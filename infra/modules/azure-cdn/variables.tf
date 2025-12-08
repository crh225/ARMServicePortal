# =============================================================================
# VARIABLES
# =============================================================================

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
  description = "Existing resource group where CDN will be created"
}

variable "origin_hostname" {
  type        = string
  description = "Origin hostname (e.g., storage account static website endpoint like mystorageaccount.z20.web.core.windows.net)"
}

variable "custom_domain" {
  type        = string
  description = "Custom domain name (e.g., portal.chrishouse.io). Requires DNS CNAME setup."
  default     = null
}

variable "sku" {
  type        = string
  description = "CDN SKU: Standard_Microsoft (cheapest), Standard_Akamai, Standard_Verizon, Premium_Verizon"
  default     = "Standard_Microsoft"

  validation {
    condition     = contains(["Standard_Microsoft", "Standard_Akamai", "Standard_Verizon", "Premium_Verizon"], var.sku)
    error_message = "SKU must be one of: Standard_Microsoft, Standard_Akamai, Standard_Verizon, Premium_Verizon"
  }
}

variable "optimization_type" {
  type        = string
  description = "Optimization type for content delivery"
  default     = "GeneralWebDelivery"

  validation {
    condition     = contains(["GeneralWebDelivery", "DynamicSiteAcceleration", "LargeFileDownload", "VideoOnDemandMediaStreaming"], var.optimization_type)
    error_message = "Must be: GeneralWebDelivery, DynamicSiteAcceleration, LargeFileDownload, or VideoOnDemandMediaStreaming"
  }
}

variable "enable_https" {
  type        = bool
  description = "Enable HTTPS with managed certificate for custom domain"
  default     = true
}

variable "enable_compression" {
  type        = bool
  description = "Enable compression for text content (HTML, CSS, JS)"
  default     = true
}

variable "query_string_caching" {
  type        = string
  description = "Query string caching behavior"
  default     = "IgnoreQueryString"

  validation {
    condition     = contains(["IgnoreQueryString", "UseQueryString", "NotSet", "BypassCaching"], var.query_string_caching)
    error_message = "Must be: IgnoreQueryString, UseQueryString, NotSet, or BypassCaching"
  }
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
