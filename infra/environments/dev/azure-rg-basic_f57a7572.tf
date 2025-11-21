module "azure-rg-basic_f57a7572" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test123bvc111"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "89"
  }
}

output "azure-rg-basic_f57a7572_resource_group_name" {
  value       = module.azure-rg-basic_f57a7572.resource_group_name
  description = "The name of the created resource group"
}