module "azure-rg-basic_938996d6" {
  source       = "../../modules/azure-rg-basic"
  project_name = "888test888"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "91"
  }
}

output "azure-rg-basic_938996d6_resource_group_name" {
  value       = module.azure-rg-basic_938996d6.resource_group_name
  description = "The name of the created resource group"
}