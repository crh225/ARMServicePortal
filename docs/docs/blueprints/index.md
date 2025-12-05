# Blueprints Overview

Blueprints are pre-configured infrastructure templates that follow organizational standards and best practices.

## Available Blueprints

### Compute & Containers
- Coming soon: AKS, Container Apps, VMs

### Data & Storage
- [Azure Storage Account](azure-storage-basic.md) - General purpose v2 storage
- [Azure PostgreSQL Flexible Server](azure-postgres-flexible.md) - Managed PostgreSQL

### Security & Identity
- [Azure Key Vault](azure-key-vault-basic.md) - Secrets and key management

### Foundation
- [Azure Resource Group](azure-rg-basic.md) - Logical container for resources

## Naming Conventions

All resources follow the naming convention:
```
{project}-{environment}-{resource-type}
```

For example: `myapp-dev-rg`, `myapp-prod-kv`

## Tagging Standards

Resources are automatically tagged with:
- `environment` - dev, qa, staging, prod
- `project` - Your project name
- `managed-by` - arm-portal
- `request-id` - PR number for traceability
