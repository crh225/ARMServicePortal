# Register Microsoft.Elastic resource provider
resource "azurerm_resource_provider_registration" "elastic" {
  name = "Microsoft.Elastic"
}

# Azure Elastic Cloud deployment
resource "azurerm_elastic_cloud_elasticsearch" "main" {
  depends_on = [azurerm_resource_provider_registration.elastic]
  name                = "es-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location

  sku_name = var.sku_name

  elastic_cloud_email_address = var.elastic_email

  # Monitoring configuration
  monitoring_enabled = var.monitoring_enabled

  tags = local.common_tags
}
