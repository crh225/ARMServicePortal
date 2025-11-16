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
