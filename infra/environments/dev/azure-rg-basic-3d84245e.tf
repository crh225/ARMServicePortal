module "azure-rg-basic-3d84245e" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test121225"
  environment  = "dev"
  location     = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "265"
  }
}

output "azure-rg-basic-3d84245e_resource_group_name" {
  value       = module.azure-rg-basic-3d84245e.resource_group_name
  description = "The name of the created resource group"
}