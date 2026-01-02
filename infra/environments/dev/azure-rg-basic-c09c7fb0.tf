module "azure-rg-basic-c09c7fb0" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test122225"
  environment  = "dev"
  location     = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "278"
  }
}

output "azure-rg-basic-c09c7fb0_resource_group_name" {
  value       = module.azure-rg-basic-c09c7fb0.resource_group_name
  description = "The name of the created resource group"
}