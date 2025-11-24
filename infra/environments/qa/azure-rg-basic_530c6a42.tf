module "azure-rg-basic_530c6a42" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-112525-rg2"
  environment = "qa"
  subscription_id = "f989de0f-8697-4a05-8c34-b82c941767c0"
  location = "westus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "qa"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "133"
  }
}

output "azure-rg-basic_530c6a42_resource_group_name" {
  value       = module.azure-rg-basic_530c6a42.resource_group_name
  description = "The name of the created resource group"
}