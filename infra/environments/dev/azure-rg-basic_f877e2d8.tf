module "azure-rg-basic_f877e2d8" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testztest"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_f877e2d8"
  }
}

output "azure-rg-basic_f877e2d8_resource_group_name" {
  value       = module.azure-rg-basic_f877e2d8.resource_group_name
  description = "The name of the created resource group"
}