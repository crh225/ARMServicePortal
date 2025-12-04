module "azure-rg-basic-d9843092" {
  source       = "../../modules/azure-rg-basic"
  project_name = "12032025"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "213"
  }
}

output "azure-rg-basic-d9843092_resource_group_name" {
  value       = module.azure-rg-basic-d9843092.resource_group_name
  description = "The name of the created resource group"
}