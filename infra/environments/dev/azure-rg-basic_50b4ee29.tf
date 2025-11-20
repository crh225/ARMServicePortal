module "azure-rg-basic_50b4ee29" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test1120252"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "85"
  }
}

output "azure-rg-basic_50b4ee29_resource_group_name" {
  value       = module.azure-rg-basic_50b4ee29.resource_group_name
  description = "The name of the created resource group"
}