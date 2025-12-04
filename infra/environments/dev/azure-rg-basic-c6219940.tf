module "azure-rg-basic-c6219940" {
  source       = "../../modules/azure-rg-basic"
  project_name = "120420252"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic-c6219940"
  }
}

output "azure-rg-basic-c6219940_resource_group_name" {
  value       = module.azure-rg-basic-c6219940.resource_group_name
  description = "The name of the created resource group"
}