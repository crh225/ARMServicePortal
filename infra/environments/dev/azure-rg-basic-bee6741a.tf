module "azure-rg-basic-bee6741a" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test12325"
  environment = "dev"
  location = "westus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic-bee6741a"
  }
}

output "azure-rg-basic-bee6741a_resource_group_name" {
  value       = module.azure-rg-basic-bee6741a.resource_group_name
  description = "The name of the created resource group"
}