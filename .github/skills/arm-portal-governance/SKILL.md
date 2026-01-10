---
name: arm-portal-governance
description: Rules, workflows, and constraints for the ARM Service Portal GitOps platform. Use when modifying infrastructure code, Terraform, Crossplane claims, provisioning workflows, or any infrastructure changes.
license: MIT
metadata:
  author: crh225
  version: "1.0"
---

# ARM Service Portal Governance

This is a GitOps-driven self-service Azure infrastructure provisioning platform. All infrastructure changes must flow through Git.

## Critical Rules

Before making ANY changes, understand these non-negotiable constraints:

### Never Do These

- Direct Azure mutations outside GitOps workflow
- Modify Terraform state files
- Bypass approval gates
- Merge PRs automatically to non-dev environments
- Delete resources without explicit destroy workflow
- Modify Azure Key Vault secrets or GitHub App keys
- Relax security policy configurations

### Always Do These

- All infrastructure changes flow through Git PRs
- Production changes require two approvals
- Policy violations block requests (not warn)
- Use blueprints for provisioning, not raw Terraform

## Architecture

| Component | Purpose |
|-----------|---------|
| Portal Frontend | React UI for blueprint catalog and provisioning |
| Portal Backend | Node.js API, GitHub orchestration, policy enforcement |
| Backstage | Infrastructure catalog, resource discovery |
| ArgoCD | GitOps reconciliation on hub cluster |
| Crossplane | Kubernetes-native infrastructure claims |
| GitHub Actions | Terraform plan/apply execution |

## Provisioning Flow

```
User selects blueprint → Backend validates → Creates PR → Terraform plan → Human approval → Merge → Terraform apply → Resource created
```

## Environment Approval Requirements

| Environment | Approvals | Constraints |
|-------------|-----------|-------------|
| Dev | 0 | Auto-merge enabled |
| QA | 1 | Business hours |
| Staging | 1 | Must match QA config |
| Prod | 2 | Business hours, change control |

## Repository Structure

- `/portal/` - React frontend and Node.js backend
- `/infra/` - Terraform modules, environments, Crossplane claims
- `/backstage/` - Backstage configuration and templates
- `/.github/workflows/` - CI/CD pipelines

## Detailed Documentation

See the full governance docs in `.ai/`:

- [Context](.ai/context.md) - System mental model
- [Intent](.ai/intent.md) - Architectural philosophy
- [Rules](.ai/rules.md) - Hard constraints
- [Workflows](.ai/workflows.md) - Approved execution paths
