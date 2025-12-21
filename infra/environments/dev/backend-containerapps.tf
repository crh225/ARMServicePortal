# Backend infrastructure uses existing resource group to avoid destroying current ACR/Container Apps
# The resources already exist in rg-testpr3-dev-rg - we reference it via data source
data "azurerm_resource_group" "backend_infra" {
  name = "rg-testpr3-dev-rg"
}

# Tell Terraform we intentionally removed the RG module but don't want to destroy the resource
# This was previously managed by module.azure-rg-basic_b0802fb2 but is now referenced via data source
removed {
  from = module.azure-rg-basic_b0802fb2

  lifecycle {
    destroy = false
  }
}

resource "random_string" "acr_suffix" {
  length  = 4
  upper   = false
  special = false
  numeric = true
}

resource "azurerm_container_registry" "backend_acr" {
  name                = "armportalacr${random_string.acr_suffix.result}"
  resource_group_name = data.azurerm_resource_group.backend_infra.name
  location            = data.azurerm_resource_group.backend_infra.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "backend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

# Container App resources removed - migrated to AKS
# Log Analytics, Container App Environment, and Container App deleted
# ACR retained above for AKS image storage

output "backend_acr_login_server" {
  value = azurerm_container_registry.backend_acr.login_server
}
