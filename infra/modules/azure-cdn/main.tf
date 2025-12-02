# Azure CDN Module
# Provides cost-effective CDN for static websites with custom domain and HTTPS support
# Much cheaper alternative to Azure Front Door (~$0.08/GB vs $35+/month base)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

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

# =============================================================================
# LOCALS
# =============================================================================

locals {
  name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-cdn"
    "armportal-owner"       = var.owner
  }

  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  all_tags = merge(local.armportal_tags_with_request, var.tags)

  # Content types to compress
  compressed_content_types = var.enable_compression ? [
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml",
    "text/xml",
    "text/plain",
    "image/svg+xml",
    "application/font-woff",
    "application/font-woff2"
  ] : []
}

# =============================================================================
# RESOURCES
# =============================================================================

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

# CDN Profile
resource "azurerm_cdn_profile" "this" {
  name                = "cdn-${local.name_prefix}-${random_string.suffix.result}"
  location            = "Global"
  resource_group_name = var.resource_group_name
  sku                 = var.sku

  tags = local.all_tags
}

# CDN Endpoint
resource "azurerm_cdn_endpoint" "this" {
  name                          = "cdne-${local.name_prefix}-${random_string.suffix.result}"
  profile_name                  = azurerm_cdn_profile.this.name
  location                      = "Global"
  resource_group_name           = var.resource_group_name
  optimization_type             = var.optimization_type
  origin_host_header            = var.origin_hostname
  querystring_caching_behaviour = var.query_string_caching
  is_compression_enabled        = var.enable_compression
  content_types_to_compress     = local.compressed_content_types

  origin {
    name      = "primary-origin"
    host_name = var.origin_hostname
  }

  # Global delivery rule for SPA support (redirect all to index.html for 404s)
  global_delivery_rule {
    modify_response_header_action {
      action = "Overwrite"
      name   = "X-Content-Type-Options"
      value  = "nosniff"
    }
  }

  # URL rewrite for SPA - serve index.html for missing paths
  delivery_rule {
    name  = "SPARewrite"
    order = 1

    url_file_extension_condition {
      operator     = "LessThan"
      match_values = ["1"]
    }

    url_rewrite_action {
      destination             = "/index.html"
      preserve_unmatched_path = false
      source_pattern          = "/"
    }
  }

  tags = local.all_tags
}

# Custom Domain (if provided)
# NOTE: Requires DNS CNAME: <custom_domain> -> <cdn_endpoint>.azureedge.net
resource "azurerm_cdn_endpoint_custom_domain" "this" {
  count           = var.custom_domain != null ? 1 : 0
  name            = replace(var.custom_domain, ".", "-")
  cdn_endpoint_id = azurerm_cdn_endpoint.this.id
  host_name       = var.custom_domain

  # Enable HTTPS with CDN-managed certificate
  dynamic "cdn_managed_https" {
    for_each = var.enable_https ? [1] : []
    content {
      certificate_type = "Dedicated"
      protocol_type    = "ServerNameIndication"
      tls_version      = "TLS12"
    }
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "cdn_profile_name" {
  value       = azurerm_cdn_profile.this.name
  description = "CDN profile name"
}

output "cdn_endpoint_hostname" {
  value       = azurerm_cdn_endpoint.this.fqdn
  description = "CDN endpoint hostname (*.azureedge.net)"
}

output "cdn_endpoint_url" {
  value       = "https://${azurerm_cdn_endpoint.this.fqdn}"
  description = "CDN endpoint URL"
}

output "custom_domain_hostname" {
  value       = var.custom_domain
  description = "Custom domain hostname (if configured)"
}

output "custom_domain_url" {
  value       = var.custom_domain != null ? "https://${var.custom_domain}" : null
  description = "Custom domain URL (if configured)"
}

output "origin_hostname" {
  value       = var.origin_hostname
  description = "Origin hostname"
}

output "dns_cname_target" {
  value       = azurerm_cdn_endpoint.this.fqdn
  description = "DNS CNAME target - point your custom domain to this value"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "Resource group name"
}
