module "azure-rg-basic_aec6cadd" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-112525-rg1"
  environment = "dev"
  subscription_id = "f989de0f-8697-4a05-8c34-b82c941767c0"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "132"
  }
}

output "azure-rg-basic_aec6cadd_resource_group_name" {
  value       = module.azure-rg-basic_aec6cadd.resource_group_name
  description = "The name of the created resource group"
}