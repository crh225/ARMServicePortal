module "azure-rg-basic_f8bfbe16" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-elk-logging"
  environment  = "dev"
  location     = "westus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "158"
  }
}

output "azure-rg-basic_f8bfbe16_resource_group_name" {
  value       = module.azure-rg-basic_f8bfbe16.resource_group_name
  description = "The name of the created resource group"
}