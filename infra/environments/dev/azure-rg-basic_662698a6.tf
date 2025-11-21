module "azure-rg-basic_662698a6" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-112025-3"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_662698a6"
  }
}

output "azure-rg-basic_662698a6_resource_group_name" {
  value       = module.azure-rg-basic_662698a6.resource_group_name
  description = "The name of the created resource group"
}