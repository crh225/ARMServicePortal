resource "random_string" "acr_suffix" {
  length  = 4
  upper   = false
  special = false
  numeric = true
}

resource "azurerm_container_registry" "backend_acr" {
  name                = "armportalacr${random_string.acr_suffix.result}"
  resource_group_name = module.azure-rg-basic_b0802fb2.resource_group_name
  location            = "eastus2"
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "aca" {
  name                = "log-armportal-dev"
  location            = "eastus2"
  resource_group_name = module.azure-rg-basic_b0802fb2.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "backend" {
  name                       = "cae-armportal-dev"
  location                   = "eastus2"
  resource_group_name        = module.azure-rg-basic_b0802fb2.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.aca.id
}

resource "azurerm_container_app" "backend" {
  name                         = "armportal-api-dev"
  resource_group_name          = module.azure-rg-basic_b0802fb2.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.backend.id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.backend_acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.backend_acr.login_server
    username             = azurerm_container_registry.backend_acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = true
    target_port      = 4000
    transport        = "auto"

    # Required in azurerm v4+: at least one traffic_weight block
    traffic_weight {
      percentage       = 100
      latest_revision  = true
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "armportal-api-backend"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}

output "backend_api_url" {
  value = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}
