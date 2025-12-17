# ARM Service Portal – Rules

## Platform Safety Rules

### Actions That Must Never Occur Implicitly

- Production infrastructure changes without two explicit approvals
- Resource deletion without a dedicated destroy request
- Policy bypass for any environment
- Direct Azure mutations outside the GitOps workflow
- Automatic merge of pull requests to production-bound branches
- Exposure of secrets in PR bodies, logs, or notifications

### Operations Requiring Explicit Human Intent

- Merging any pull request (except auto-merge in dev)
- Approving production promotions
- Initiating resource destruction
- Modifying blueprint definitions
- Changing policy configurations
- Rotating credentials or secrets

Explicit human intent means an approved and merged pull request that satisfies all environment-specific review requirements.

## GitOps and Change Control Rules

### What Must Flow Through Git

- All infrastructure configurations (Terraform modules, Crossplane claims)
- All environment-specific variable files
- All catalog-info.yaml entries for Backstage
- All ArgoCD application manifests

### What May Never Bypass Pull Requests

- Infrastructure changes to any environment
- Blueprint additions or modifications
- Policy configuration changes
- Workflow definition changes
- Crossplane XRD or composition changes

### Branch Protection Requirements

- Main branch requires pull request reviews
- Direct pushes to main are prohibited
- Status checks must pass before merge
- Administrators are not exempt from these rules

## Infrastructure and Terraform Rules

### What May Be Generated

- Terraform configuration files from blueprint templates
- Crossplane claim YAML from blueprint templates
- Catalog-info.yaml entries for provisioned resources
- GitHub PR bodies and descriptions

### What Must Be Treated as Immutable

- Blueprint schema definitions (version changes require new blueprint version)
- Crossplane XRD specifications (breaking changes require migration)
- Terraform state files (managed exclusively by Terraform)
- GitHub App credentials and secrets

Terraform state restoration is a controlled, manual operation and must not be initiated by automation or AI agents.

### What Must Be Manually Curated

- Blueprint catalog entries
- Policy configuration rules
- Environment definitions
- Approval requirements per environment
- Cost thresholds and limits

## Automation Contract Rules

### Invariants Relied Upon by Automation

- Every provisioning request creates exactly one branch and one PR
- Terraform state is stored in Azure Blob Storage at predictable paths
- GitHub Actions workflows trigger on merge to main
- Webhook events are delivered to the configured Azure Function endpoint
- Redis and RabbitMQ are available for the notification pipeline

### Assumptions Downstream Systems Depend On

- Catalog-info.yaml files follow Backstage entity schema
- Terraform outputs are available as PR comments after apply
- Environment names are consistent: dev, qa, staging, prod
- Resource naming follows the enforced convention
- Required tags are present on all provisioned resources

## LLM Guardrails

### What an AI Assistant Must Never Modify

- Terraform state files
- Azure Key Vault secrets
- GitHub App private keys
- Policy configuration that relaxes security constraints
- Approval requirements for any environment
- Branch protection rules

### Read-Only Areas

- Terraform state (query only via terraform show)
- Azure resource properties (query only via Azure APIs)
- GitHub PR history and audit logs
- Deployed resource configurations

### Assistive Areas (May Suggest, Must Not Execute Without Approval)

- Blueprint variable values
- New blueprint definitions
- Policy configuration additions
- Terraform module improvements
- Workflow optimizations

Suggestions must not include executable changes unless implemented through an approved and merged pull request.

### Prohibited Actions

- Bypassing approval gates
- Merging PRs automatically to non-dev environments
- Deleting resources without explicit destroy workflow
- Modifying credentials or secrets
- Disabling policy enforcement
- Granting direct Azure access
- Initiating recovery or state restoration procedures without explicit human request
