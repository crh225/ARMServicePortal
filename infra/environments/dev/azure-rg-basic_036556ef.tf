module "azure-rg-basic_036556ef" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test112725"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_036556ef"
  }
}

output "azure-rg-basic_036556ef_resource_group_name" {
  value       = module.azure-rg-basic_036556ef.resource_group_name
  description = "The name of the created resource group"
}