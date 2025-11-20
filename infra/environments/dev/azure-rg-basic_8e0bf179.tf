module "azure-rg-basic_8e0bf179" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-112025"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "83"
  }
}

output "azure-rg-basic_8e0bf179_resource_group_name" {
  value       = module.azure-rg-basic_8e0bf179.resource_group_name
  description = "The name of the created resource group"
}