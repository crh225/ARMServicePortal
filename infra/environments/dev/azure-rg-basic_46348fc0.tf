module "azure-rg-basic_46348fc0" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-11-19-25-8"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_46348fc0"
  }
}

output "azure-rg-basic_46348fc0_resource_group_name" {
  value       = module.azure-rg-basic_46348fc0.resource_group_name
  description = "The name of the created resource group"
}