module "azure-rg-basic-eee56042" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test123"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "238"
  }
}

output "azure-rg-basic-eee56042_resource_group_name" {
  value       = module.azure-rg-basic-eee56042.resource_group_name
  description = "The name of the created resource group"
}