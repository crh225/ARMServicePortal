module "azure-rg-basic_a0fa61d4" {
  source       = "../../modules/azure-rg-basic"
  project_name = "999test999"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_a0fa61d4"
  }
}

output "azure-rg-basic_a0fa61d4_resource_group_name" {
  value       = module.azure-rg-basic_a0fa61d4.resource_group_name
  description = "The name of the created resource group"
}