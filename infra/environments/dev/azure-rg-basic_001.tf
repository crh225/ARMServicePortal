import {
  to = module.azure-rg-basic_test_not_in_tf_1.azurerm_resource_group.this
  id = "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/test-not-in-tf-1"
}

# Import existing resource into Terraform management
# Generated using blueprint: azure-rg-basic

module "azure-rg-basic_test_not_in_tf_1" {
  source = "../../modules/azure-rg-basic"

  project_name = "test-not-in-tf-1"
  environment = "dev"
  location = "westcentralus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-owner       = "imported"
  }
}
