module "azure-rg-basic_16b4f08f" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test12345"
  environment = "dev"
  location = "eastus2"
}

output "azure-rg-basic_16b4f08f_resource_group_name" {
  value       = module.azure-rg-basic_16b4f08f.resource_group_name
  description = "The name of the created resource group"
}