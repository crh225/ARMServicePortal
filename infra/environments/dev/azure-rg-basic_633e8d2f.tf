module "azure-rg-basic_633e8d2f" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test112525-5"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "159"
  }
}

output "azure-rg-basic_633e8d2f_resource_group_name" {
  value       = module.azure-rg-basic_633e8d2f.resource_group_name
  description = "The name of the created resource group"
}