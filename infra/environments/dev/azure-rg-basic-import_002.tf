import {
  to = azurerm_resource_group.test_not_in_tf_1
  id = "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/test-not-in-tf-1"
}

resource "azurerm_resource_group" "test_not_in_tf_1" {
  name                = "test-not-in-tf-1"
  location            = "westcentralus"

  # Additional properties may be required. Review Azure resource configuration:
  # Properties found: {
  #   "provisioningState": "Succeeded"
  # }

    # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-key-vault-basic"
    armportal-owner       = "imported"
  }
}
