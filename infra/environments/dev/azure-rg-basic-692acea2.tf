module "azure-rg-basic-692acea2" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testaz"
  environment  = "dev"
  location     = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "243"
  }
}

output "azure-rg-basic-692acea2_resource_group_name" {
  value       = module.azure-rg-basic-692acea2.resource_group_name
  description = "The name of the created resource group"
}