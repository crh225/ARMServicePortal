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
