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

locals {
  # Make a safe name prefix from project + environment
  name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-frontdoor"
    "armportal-owner"       = var.owner
  }

  # Add request-id only if provided
  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  # Merge ARM Portal tags with user tags (user tags can override)
  all_tags = merge(local.armportal_tags_with_request, var.tags)
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

# Azure Front Door Profile
resource "azurerm_cdn_frontdoor_profile" "this" {
  name                = "afd-${local.name_prefix}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name

  tags = local.all_tags
}

# Front Door Endpoint
resource "azurerm_cdn_frontdoor_endpoint" "this" {
  name                     = "ep-${local.name_prefix}-${random_string.suffix.result}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id

  tags = local.all_tags
}

# Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "this" {
  name                     = "og-${local.name_prefix}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    interval_in_seconds = 100
    path                = "/"
    protocol            = "Https"
    request_type        = "HEAD"
  }
}

# Origin (Static Website)
resource "azurerm_cdn_frontdoor_origin" "this" {
  name                          = "origin-${local.name_prefix}"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.this.id

  enabled                        = true
  host_name                      = var.origin_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = var.origin_hostname
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

# Route
resource "azurerm_cdn_frontdoor_route" "this" {
  name                          = "route-${local.name_prefix}"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.this.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.this.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.this.id]

  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  link_to_default_domain = true
  https_redirect_enabled = true
}

# Custom Domain (if provided)
resource "azurerm_cdn_frontdoor_custom_domain" "this" {
  count                    = var.custom_domain != null ? 1 : 0
  name                     = "cd-${replace(var.custom_domain, ".", "-")}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this.id
  dns_zone_id              = null
  host_name                = var.custom_domain

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

# NOTE: Custom domain association must be done AFTER DNS validation is complete.
# The validation requires you to:
# 1. Add TXT record: _dnsauth.<your-domain> with the validation_token from outputs
# 2. Add CNAME record: <your-domain> pointing to the frontdoor_endpoint_hostname
# 3. Wait for Azure to validate (5-15 minutes)
# 4. Then manually associate the custom domain with the route in Azure Portal
#
# Uncomment this resource after DNS validation is complete:
#
# resource "azurerm_cdn_frontdoor_custom_domain_association" "this" {
#   count                          = var.custom_domain != null ? 1 : 0
#   cdn_frontdoor_custom_domain_id = azurerm_cdn_frontdoor_custom_domain.this[0].id
#   cdn_frontdoor_route_ids        = [azurerm_cdn_frontdoor_route.this.id]
# }

output "frontdoor_endpoint_hostname" {
  value       = azurerm_cdn_frontdoor_endpoint.this.host_name
  description = "Front Door endpoint hostname"
}

output "frontdoor_profile_id" {
  value       = azurerm_cdn_frontdoor_profile.this.id
  description = "Front Door profile ID"
}

output "custom_domain_validation_token" {
  value       = var.custom_domain != null ? azurerm_cdn_frontdoor_custom_domain.this[0].validation_token : null
  description = "Validation token for custom domain (add as TXT record)"
}

output "custom_domain_name" {
  value       = var.custom_domain
  description = "Custom domain name"
}
