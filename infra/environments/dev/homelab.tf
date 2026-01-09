# Homelab Resource Group
# For Azure Arc machines and edge devices

resource "azurerm_resource_group" "homelab" {
  name     = "rg-homelab"
  location = "East US"

  tags = {
    "purpose"               = "homelab"
    "managed-by"            = "terraform"
    "armportal-environment" = "shared"
  }
}