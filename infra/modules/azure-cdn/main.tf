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
