# Azure CDN Module
# Provides cost-effective CDN for static websites with custom domain and HTTPS support
# Much cheaper alternative to Azure Front Door (~$0.08/GB vs $35+/month base)

terraform {
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
