module "azure-rg-basic_5e856903" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test9991"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_5e856903"
  }
}

output "azure-rg-basic_5e856903_resource_group_name" {
  value       = module.azure-rg-basic_5e856903.resource_group_name
  description = "The name of the created resource group"
}