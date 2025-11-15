# Infra (Terraform)

This folder is the Terraform source of truth used by the portal.

- `modules/azure-rg-basic/` – example module for a basic Resource Group
- `environments/dev/`      – Terraform root for dev, plus `requests/` where the
  portal writes module files.

The backend writes files like:

- `infra/environments/dev/requests/azure-rg-basic_ab12cd34.tf`

Each file contains a `module` block referencing `../../modules/azure-rg-basic`. Terraform
automatically loads all `*.tf` files in this directory, so those modules are
included in `plan` and `apply`.
