module "azure-rg-basic-4ebdb2d0" {
  source       = "../../modules/azure-rg-basic"
  project_name = "12225"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "201"
  }
}

output "azure-rg-basic-4ebdb2d0_resource_group_name" {
  value       = module.azure-rg-basic-4ebdb2d0.resource_group_name
  description = "The name of the created resource group"
}