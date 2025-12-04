module "azure-rg-basic-090291e7" {
  source       = "../../modules/azure-rg-basic"
  project_name = "12042025"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "225"
  }
}

output "azure-rg-basic-090291e7_resource_group_name" {
  value       = module.azure-rg-basic-090291e7.resource_group_name
  description = "The name of the created resource group"
}