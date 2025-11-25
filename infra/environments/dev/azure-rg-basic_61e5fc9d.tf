module "azure-rg-basic_61e5fc9d" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-rg-elastic"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "157"
  }
}

output "azure-rg-basic_61e5fc9d_resource_group_name" {
  value       = module.azure-rg-basic_61e5fc9d.resource_group_name
  description = "The name of the created resource group"
}