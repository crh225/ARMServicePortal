module "azure-rg-basic_fb64daaf" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test123456"
  environment = "dev"
  location = "eastus2"
}

output "azure-rg-basic_fb64daaf_resource_group_name" {
  value       = module.azure-rg-basic_fb64daaf.resource_group_name
  description = "The name of the created resource group"
}