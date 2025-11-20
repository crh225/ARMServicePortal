module "azure-rg-basic_d203b211" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-11-19-25-7"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic_d203b211"
  }
}

output "azure-rg-basic_d203b211_resource_group_name" {
  value       = module.azure-rg-basic_d203b211.resource_group_name
  description = "The name of the created resource group"
}