variable "github_infra_owner" {
  type        = string
  description = "GitHub owner (user or org) that hosts the infra repo"
}

variable "github_infra_repo" {
  type        = string
  description = "GitHub repo name that holds the Terraform code"
}

variable "github_app_id" {
  type        = string
  description = "GitHub App ID used by the backend"
}

variable "github_installation_id" {
  type        = string
  description = "GitHub App installation ID for this repo/org"
}

variable "github_app_private_key_base64" {
  type        = string
  description = "Base64-encoded GitHub App private key"
  sensitive   = true
}

variable "github_webhook_secret" {
  type        = string
  description = "GitHub webhook secret for signature verification"
  sensitive   = true
}

variable "elasticsearch_api_key" {
  type        = string
  description = "Elasticsearch API key for log shipping"
  sensitive   = true
}

variable "github_oauth_client_id" {
  type        = string
  description = "GitHub OAuth App client ID for user authentication"
}

variable "github_oauth_client_secret" {
  type        = string
  description = "GitHub OAuth App client secret"
  sensitive   = true
}

variable "azure_app_config_endpoint" {
  type        = string
  description = "Azure App Configuration endpoint URL"
}

variable "service_api_key" {
  type        = string
  description = "API key for service-to-service authentication (Backstage)"
  sensitive   = true
}
