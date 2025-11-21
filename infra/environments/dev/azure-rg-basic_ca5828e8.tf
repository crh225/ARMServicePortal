module "azure-rg-basic_ca5828e8" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test123999"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_ca5828e8"
  }
}

output "azure-rg-basic_ca5828e8_resource_group_name" {
  value       = module.azure-rg-basic_ca5828e8.resource_group_name
  description = "The name of the created resource group"
}