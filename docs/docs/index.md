# ARM Portal Documentation

Welcome to the ARM Portal documentation. This portal provides self-service infrastructure provisioning for Azure resources.

## Getting Started

Use the **Create** menu in Backstage to provision new infrastructure resources. Each template follows a GitOps workflow:

1. Fill out the template form with your configuration
2. A Pull Request is automatically created with the Terraform configuration
3. Review and merge the PR to trigger deployment
4. Resources are provisioned via GitHub Actions and Terraform

## Available Blueprints

| Blueprint | Description |
|-----------|-------------|
| [Azure Resource Group](blueprints/azure-rg-basic.md) | Creates a Resource Group with standardized naming |
| [Azure Storage Account](blueprints/azure-storage-basic.md) | Creates a Storage Account in an existing RG |
| [Azure Key Vault](blueprints/azure-key-vault-basic.md) | Creates a Key Vault for secrets management |
| [Azure PostgreSQL](blueprints/azure-postgres-flexible.md) | Creates a PostgreSQL Flexible Server |

## Architecture

The ARM Portal uses a GitOps workflow:

```
Backstage Template -> ARM Portal Backend -> GitHub PR -> Terraform Apply
```

All infrastructure is managed as code in the `infra/` directory.
