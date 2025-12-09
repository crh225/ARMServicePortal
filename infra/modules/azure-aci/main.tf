resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_container_group" "this" {
  name                = "${local.container_name}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  restart_policy      = var.restart_policy

  # IP address configuration (only if enabled)
  ip_address_type = local.enable_ip ? var.ip_address_type : null
  dns_name_label  = local.enable_ip && var.ip_address_type == "Public" ? "${local.dns_name_label}-${random_string.suffix.result}" : null

  container {
    name   = local.container_name
    image  = var.container_image
    cpu    = tonumber(var.cpu_cores)
    memory = tonumber(var.memory_gb)

    # Ports configuration
    dynamic "ports" {
      for_each = var.port != "" && local.enable_ip ? [tonumber(var.port)] : []
      content {
        port     = ports.value
        protocol = "TCP"
      }
    }

    # Environment variables from JSON (map of key => value)
    environment_variables = local.env_vars
  }

  tags = local.all_tags
}
