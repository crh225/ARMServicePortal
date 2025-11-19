# Grant Container App managed identity Reader access to query Azure Resource Graph
# This enables the /api/resources endpoint to list ARM Portal managed resources

# Get current subscription info
data "azurerm_client_config" "current" {}

# Grant Reader role at subscription level
# This allows the Container App to query Azure Resource Graph for resources with armportal-* tags
resource "azurerm_role_assignment" "aca_reader" {
  scope                = "/subscriptions/${data.azurerm_client_config.current.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = azurerm_container_app.backend.identity[0].principal_id

  # Ensure Container App exists first
  depends_on = [azurerm_container_app.backend]
}
