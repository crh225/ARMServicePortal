module "azure-rg-basic_918874c3" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "138"
  }
}

output "azure-rg-basic_918874c3_resource_group_name" {
  value       = module.azure-rg-basic_918874c3.resource_group_name
  description = "The name of the created resource group"
}