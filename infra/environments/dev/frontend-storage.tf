resource "random_string" "frontend_sa_suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "frontend" {
  name                     = "armportalfe${random_string.frontend_sa_suffix.result}"
  resource_group_name      = module.azure-rg-basic_b0802fb2.resource_group_name
  location                 = "eastus2"
  account_tier             = "Standard"
  account_replication_type = "LRS"

  enable_https_traffic_only   = true
  allow_nested_items_to_be_public = true

  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }
}

output "frontend_static_website_url" {
  value = azurerm_storage_account.frontend.primary_web_endpoint
}

output "frontend_storage_account_name" {
  value = azurerm_storage_account.frontend.name
}
