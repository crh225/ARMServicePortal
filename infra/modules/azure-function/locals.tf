locals {
  # Sanitize names for Azure resources
  name_prefix = lower(replace("${var.project_name}-${var.environment}", "/[^a-z0-9-]/", ""))

  # Storage account name (max 24 chars, alphanumeric only)
  storage_name_prefix = lower(replace("${var.project_name}${var.environment}func", "/[^a-z0-9]/", ""))

  # ARM Portal required tags
  armportal_tags = {
    "armportal-environment" = var.environment
    "armportal-blueprint"   = "azure-function"
    "armportal-owner"       = var.owner
  }

  # Add request-id only if provided
  armportal_tags_with_request = var.request_id != null ? merge(
    local.armportal_tags,
    { "armportal-request-id" = var.request_id }
  ) : local.armportal_tags

  # Merge ARM Portal tags with user tags (user tags can override)
  all_tags = merge(local.armportal_tags_with_request, var.tags)

  # Runtime-specific settings
  runtime_settings = {
    node = {
      linux_fx_version  = "Node|${var.runtime_version}"
      windows_fx_version = "node|${var.runtime_version}"
    }
    dotnet = {
      linux_fx_version  = "DOTNET|${var.runtime_version}"
      windows_fx_version = "dotnet|${var.runtime_version}"
    }
    python = {
      linux_fx_version  = "Python|${var.runtime_version}"
      windows_fx_version = null # Python not supported on Windows consumption
    }
    java = {
      linux_fx_version  = "Java|${var.runtime_version}"
      windows_fx_version = "java|${var.runtime_version}"
    }
    powershell = {
      linux_fx_version  = "PowerShell|${var.runtime_version}"
      windows_fx_version = "powershell|${var.runtime_version}"
    }
  }

  # Determine if this is a consumption plan
  is_consumption = var.sku_name == "Y1"
}
