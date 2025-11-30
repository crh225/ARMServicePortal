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

# =============================================================================
# VARIABLES
# =============================================================================

variable "project_name" {
  type        = string
  description = "Short name of the project"
}

variable "environment" {
  type        = string
  description = "Environment (e.g. dev, qa, staging, prod)"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group where the Function App will be created"
}

variable "location" {
  type        = string
  description = "Azure region for resources"
}

variable "runtime_stack" {
  type        = string
  description = "Runtime stack for the Function App"
  default     = "node"
  validation {
    condition     = contains(["node", "dotnet", "python", "java", "powershell"], var.runtime_stack)
    error_message = "Runtime stack must be one of: node, dotnet, python, java, powershell."
  }
}

variable "runtime_version" {
  type        = string
  description = "Version of the runtime stack"
  default     = "20"
}

variable "os_type" {
  type        = string
  description = "Operating system type (Linux or Windows)"
  default     = "Linux"
  validation {
    condition     = contains(["Linux", "Windows"], var.os_type)
    error_message = "OS type must be 'Linux' or 'Windows'."
  }
}

variable "sku_name" {
  type        = string
  description = "SKU for the App Service Plan"
  default     = "Y1"
  validation {
    condition     = contains(["Y1", "EP1", "EP2", "EP3", "B1", "B2", "B3", "S1", "S2", "S3", "P1v2", "P2v2", "P3v2", "P1v3", "P2v3", "P3v3"], var.sku_name)
    error_message = "SKU must be a valid App Service Plan SKU."
  }
}

variable "always_on" {
  type        = bool
  description = "Whether the Function App should always be running (not available for Consumption plan)"
  default     = false
}

variable "app_settings" {
  type        = map(string)
  description = "Additional application settings"
  default     = {}
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to resources"
  default     = {}
}

variable "request_id" {
  type        = string
  description = "ARM Portal request ID (PR number)"
  default     = null
}

variable "owner" {
  type        = string
  description = "ARM Portal owner"
  default     = "crh225"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for diagnostic settings"
  default     = null
}

# =============================================================================
# LOCALS
# =============================================================================

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

# =============================================================================
# RANDOM SUFFIX FOR UNIQUE NAMES
# =============================================================================

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  numeric = true
  special = false
}

# =============================================================================
# STORAGE ACCOUNT (required for Azure Functions)
# =============================================================================

resource "azurerm_storage_account" "function_storage" {
  name                = substr("${local.storage_name_prefix}${random_string.suffix.result}", 0, 24)
  resource_group_name = var.resource_group_name
  location            = var.location

  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  tags = local.all_tags
}

# =============================================================================
# APP SERVICE PLAN
# =============================================================================

resource "azurerm_service_plan" "function_plan" {
  name                = "asp-${local.name_prefix}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  os_type  = var.os_type
  sku_name = var.sku_name

  tags = local.all_tags
}

# =============================================================================
# APPLICATION INSIGHTS (for monitoring)
# =============================================================================

resource "azurerm_application_insights" "function_insights" {
  name                = "ai-${local.name_prefix}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location
  application_type    = "web"

  workspace_id = var.log_analytics_workspace_id

  tags = local.all_tags
}

# =============================================================================
# LINUX FUNCTION APP
# =============================================================================

resource "azurerm_linux_function_app" "function_app" {
  count = var.os_type == "Linux" ? 1 : 0

  name                = "func-${local.name_prefix}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  service_plan_id            = azurerm_service_plan.function_plan.id
  storage_account_name       = azurerm_storage_account.function_storage.name
  storage_account_access_key = azurerm_storage_account.function_storage.primary_access_key

  https_only = true

  site_config {
    always_on = local.is_consumption ? false : var.always_on

    application_stack {
      node_version       = var.runtime_stack == "node" ? var.runtime_version : null
      dotnet_version     = var.runtime_stack == "dotnet" ? var.runtime_version : null
      python_version     = var.runtime_stack == "python" ? var.runtime_version : null
      java_version       = var.runtime_stack == "java" ? var.runtime_version : null
      powershell_core_version = var.runtime_stack == "powershell" ? var.runtime_version : null
    }

    cors {
      allowed_origins = ["https://portal.azure.com"]
    }
  }

  app_settings = merge({
    "FUNCTIONS_WORKER_RUNTIME"       = var.runtime_stack
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.function_insights.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.function_insights.connection_string
  }, var.app_settings)

  tags = local.all_tags

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_RUN_FROM_PACKAGE"],
    ]
  }
}

# =============================================================================
# WINDOWS FUNCTION APP
# =============================================================================

resource "azurerm_windows_function_app" "function_app" {
  count = var.os_type == "Windows" ? 1 : 0

  name                = "func-${local.name_prefix}-${random_string.suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location

  service_plan_id            = azurerm_service_plan.function_plan.id
  storage_account_name       = azurerm_storage_account.function_storage.name
  storage_account_access_key = azurerm_storage_account.function_storage.primary_access_key

  https_only = true

  site_config {
    always_on = local.is_consumption ? false : var.always_on

    application_stack {
      node_version       = var.runtime_stack == "node" ? "~${var.runtime_version}" : null
      dotnet_version     = var.runtime_stack == "dotnet" ? "v${var.runtime_version}" : null
      java_version       = var.runtime_stack == "java" ? var.runtime_version : null
      powershell_core_version = var.runtime_stack == "powershell" ? var.runtime_version : null
    }

    cors {
      allowed_origins = ["https://portal.azure.com"]
    }
  }

  app_settings = merge({
    "FUNCTIONS_WORKER_RUNTIME"       = var.runtime_stack
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.function_insights.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.function_insights.connection_string
  }, var.app_settings)

  tags = local.all_tags

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_RUN_FROM_PACKAGE"],
    ]
  }
}

# =============================================================================
# DIAGNOSTIC SETTINGS
# =============================================================================

resource "azurerm_monitor_diagnostic_setting" "function_diagnostics" {
  count = var.log_analytics_workspace_id != null ? 1 : 0

  name               = "function-diagnostics"
  target_resource_id = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].id : azurerm_windows_function_app.function_app[0].id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "FunctionAppLogs"
  }

  metric {
    category = "AllMetrics"
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "function_app_name" {
  description = "Name of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].name : azurerm_windows_function_app.function_app[0].name
}

output "function_app_id" {
  description = "ID of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].id : azurerm_windows_function_app.function_app[0].id
}

output "default_hostname" {
  description = "Default hostname of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].default_hostname : azurerm_windows_function_app.function_app[0].default_hostname
}

output "function_app_url" {
  description = "URL to access the Function App"
  value       = var.os_type == "Linux" ? "https://${azurerm_linux_function_app.function_app[0].default_hostname}" : "https://${azurerm_windows_function_app.function_app[0].default_hostname}"
}

output "storage_account_name" {
  description = "Storage account name used by the Function App"
  value       = azurerm_storage_account.function_storage.name
}

output "app_service_plan_name" {
  description = "Name of the App Service Plan"
  value       = azurerm_service_plan.function_plan.name
}

output "application_insights_name" {
  description = "Name of the Application Insights instance"
  value       = azurerm_application_insights.function_insights.name
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.function_insights.instrumentation_key
  sensitive   = true
}

output "resource_group_name" {
  description = "Resource group containing the Function App"
  value       = var.resource_group_name
}
