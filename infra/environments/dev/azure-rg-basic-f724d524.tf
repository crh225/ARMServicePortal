module "azure-rg-basic-f724d524" {
  source       = "../../modules/azure-rg-basic"
  project_name = "portrgcreation2"
  environment  = "dev"
  location     = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "268"
  }
}

output "azure-rg-basic-f724d524_resource_group_name" {
  value       = module.azure-rg-basic-f724d524.resource_group_name
  description = "The name of the created resource group"
}