module "azure-rg-basic_4210b0d2" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test99zzz"
  environment = "dev"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "94"
  }
}

output "azure-rg-basic_4210b0d2_resource_group_name" {
  value       = module.azure-rg-basic_4210b0d2.resource_group_name
  description = "The name of the created resource group"
}