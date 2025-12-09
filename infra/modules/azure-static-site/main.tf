resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "this" {
  name                = substr("${local.sa_name_prefix}${random_string.suffix.result}", 0, 24)
  resource_group_name = var.resource_group_name
  location            = var.location

  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  # Enable static website hosting
  static_website {
    index_document     = var.index_document
    error_404_document = var.error_document
  }

  # Allow public access for static website
  allow_nested_items_to_be_public = true

  tags = local.all_tags
}

# Optional CDN endpoint
resource "azurerm_cdn_profile" "this" {
  count               = local.enable_cdn_bool ? 1 : 0
  name                = "cdn-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard_Microsoft"

  tags = local.all_tags
}

resource "azurerm_cdn_endpoint" "this" {
  count               = local.enable_cdn_bool ? 1 : 0
  name                = "cdn-${var.project_name}-${var.environment}-${random_string.suffix.result}"
  profile_name        = azurerm_cdn_profile.this[0].name
  location            = var.location
  resource_group_name = var.resource_group_name

  origin {
    name      = "static-website"
    host_name = replace(replace(azurerm_storage_account.this.primary_web_endpoint, "https://", ""), "/", "")
  }

  is_http_allowed  = false
  is_https_allowed = true

  tags = local.all_tags
}
