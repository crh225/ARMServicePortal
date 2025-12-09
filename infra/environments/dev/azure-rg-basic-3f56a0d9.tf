module "azure-rg-basic-3f56a0d9" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test129252"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic-3f56a0d9"
  }
}

output "azure-rg-basic-3f56a0d9_resource_group_name" {
  value       = module.azure-rg-basic-3f56a0d9.resource_group_name
  description = "The name of the created resource group"
}