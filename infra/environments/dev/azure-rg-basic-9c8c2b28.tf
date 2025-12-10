module "azure-rg-basic-9c8c2b28" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test12925"
  environment  = "dev"
  location     = "northcentralus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "263"
  }
}

output "azure-rg-basic-9c8c2b28_resource_group_name" {
  value       = module.azure-rg-basic-9c8c2b28.resource_group_name
  description = "The name of the created resource group"
}