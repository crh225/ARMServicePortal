module "azure-rg-basic-6bb00bf7" {
  source       = "../../modules/azure-rg-basic"
  project_name = "112925"
  environment  = "dev"
  location     = "westus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "181"
  }
}

output "azure-rg-basic-6bb00bf7_resource_group_name" {
  value       = module.azure-rg-basic-6bb00bf7.resource_group_name
  description = "The name of the created resource group"
}