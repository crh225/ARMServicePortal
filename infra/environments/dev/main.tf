terraform {
  required_version = ">= 1.5.0"

  backend "azurerm" {
    resource_group_name  = "rg-armportal-tfstate-dev"
    storage_account_name = "armportaltfstate9059"
    container_name       = "tfstate"
    key                  = "dev/terraform.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "f989de0f-8697-4a05-8c34-b82c941767c0"
}
