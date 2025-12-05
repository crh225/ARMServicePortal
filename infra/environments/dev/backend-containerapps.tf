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

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "backend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

resource "azurerm_log_analytics_workspace" "aca" {
  name                = "log-armportal-dev"
  location            = "eastus2"
  resource_group_name = module.azure-rg-basic_b0802fb2.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "backend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

resource "azurerm_container_app_environment" "backend" {
  name                       = "cae-armportal-dev"
  location                   = "eastus2"
  resource_group_name        = module.azure-rg-basic_b0802fb2.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.aca.id

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "backend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

resource "azurerm_container_app" "backend" {
  name                         = "armportal-api-dev"
  resource_group_name          = module.azure-rg-basic_b0802fb2.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.backend.id
  revision_mode                = "Single"

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "backend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }

  identity {
    type = "SystemAssigned"
  }

  # ACR admin password as secret
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.backend_acr.admin_password
  }

  # GitHub App private key as secret (sensitive)
  secret {
    name  = "gh-app-private-key"
    value = var.github_app_private_key_base64
  }

  # GitHub webhook secret as secret (sensitive)
  secret {
    name  = "gh-webhook-secret"
    value = var.github_webhook_secret
  }

  # Elasticsearch API key as secret (sensitive)
  secret {
    name  = "elasticsearch-api-key"
    value = var.elasticsearch_api_key
  }

  # GitHub OAuth client secret
  secret {
    name  = "gh-oauth-client-secret"
    value = var.github_oauth_client_secret
  }

  # Service API key for Backstage
  secret {
    name  = "service-api-key"
    value = var.service_api_key
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
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "armportal-api-backend"
      image  = "${azurerm_container_registry.backend_acr.login_server}/armportal-backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      # Liveness probe - check if container is running
      liveness_probe {
        transport        = "HTTP"
        path             = "/api/health"
        port             = 4000
        interval_seconds = 30
      }

      # Readiness probe - check if container is ready to receive traffic
      readiness_probe {
        transport        = "HTTP"
        path             = "/api/health"
        port             = 4000
        interval_seconds = 10
      }

      # Startup probe - give app time to start before health checks
      startup_probe {
        transport        = "HTTP"
        path             = "/api/health"
        port             = 4000
        interval_seconds = 5
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Non-sensitive GitHub config
      env {
        name  = "GH_INFRA_OWNER"
        value = var.github_infra_owner
      }

      env {
        name  = "GH_INFRA_REPO"
        value = var.github_infra_repo
      }

      env {
        name  = "GH_APP_ID"
        value = var.github_app_id
      }

      env {
        name  = "GH_INSTALLATION_ID"
        value = var.github_installation_id
      }

      # Sensitive key from secret
      env {
        name        = "GH_APP_PRIVATE_KEY_BASE64"
        secret_name = "gh-app-private-key"
      }

      # GitHub webhook secret from secret
      env {
        name        = "GITHUB_WEBHOOK_SECRET"
        secret_name = "gh-webhook-secret"
      }

      # Frontend URL for CORS
      env {
        name  = "FRONTEND_URL"
        value = "https://portal.chrishouse.io"
      }

      # App URL - using Container App FQDN directly (no custom domain)
      env {
        name  = "APP_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      # GitHub OAuth
      env {
        name  = "GH_OAUTH_CLIENT_ID"
        value = var.github_oauth_client_id
      }

      env {
        name        = "GH_OAUTH_CLIENT_SECRET"
        secret_name = "gh-oauth-client-secret"
      }

      # Azure App Configuration
      env {
        name  = "AZURE_APP_CONFIG_ENDPOINT"
        value = var.azure_app_config_endpoint
      }

      # Service API key for Backstage integration
      env {
        name        = "SERVICE_API_KEY"
        secret_name = "service-api-key"
      }

      # Elasticsearch
      env {
        name        = "ELASTICSEARCH_API_KEY"
        secret_name = "elasticsearch-api-key"
      }

      env {
        name  = "ELASTICSEARCH_URL"
        value = "https://es-test-az-elk-managed-dev-5a6e80.es.eastus2.azure.elastic-cloud.com:9243"
      }

      # Azure subscription for cost management
      env {
        name  = "AZURE_SUBSCRIPTION_ID"
        value = "f989de0f-8697-4a05-8c34-b82c941767c0"
      }

    }
  }
}

output "backend_api_url" {
  value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "backend_acr_login_server" {
  value = azurerm_container_registry.backend_acr.login_server
}
