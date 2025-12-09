resource "random_string" "suffix" {
  length  = 6
  upper   = false
  numeric = true
  special = false
}

# Container Apps Environment (required for Container Apps)
resource "azurerm_container_app_environment" "this" {
  name                = "${local.app_name}-env-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = local.all_tags
}

# Container App
resource "azurerm_container_app" "this" {
  name                         = "${local.app_name}-${random_string.suffix.result}"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"

  # Registry credentials (for private registries like ACR)
  dynamic "registry" {
    for_each = var.container_registry_server != "" ? [1] : []
    content {
      server               = var.container_registry_server
      username             = var.container_registry_username
      password_secret_name = "registry-password"
    }
  }

  # Secrets for registry password
  dynamic "secret" {
    for_each = var.container_registry_password != "" ? [1] : []
    content {
      name  = "registry-password"
      value = var.container_registry_password
    }
  }

  template {
    container {
      name   = local.app_name
      image  = var.container_image
      cpu    = tonumber(var.cpu_cores)
      memory = "${var.memory_gb}Gi"

      # Environment variables from JSON
      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }

    min_replicas = var.min_replicas
    max_replicas = var.max_replicas
  }

  ingress {
    external_enabled = var.ingress_external
    target_port      = var.target_port
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = local.all_tags
}
