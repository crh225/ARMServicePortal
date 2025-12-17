# ARM Service Portal – Intent

## Primary Goals

The platform optimizes for:

- **Safety over speed**: All changes flow through Git with review gates. No direct mutations.
- **Auditability**: Every provisioning request creates a traceable PR with full context.
- **Self-service within guardrails**: Users get autonomy; policies enforce boundaries.
- **Reproducibility**: Infrastructure is versioned, templated, and deterministic.

### Accepted Tradeoffs

- Provisioning takes minutes (PR workflow) rather than seconds (direct API)
- Blueprint catalog is curated; arbitrary resource types are not supported
- Policy violations block requests rather than warn
- Production changes require multiple approvals even for low-risk changes

## Source of Truth

### Authoritative Systems

- **Git (GitHub)**: The authoritative record of all infrastructure intent
- **Terraform State**: The authoritative record of deployed Azure resources
- **Azure**: The authoritative record of actual resource state

### What the Portal Represents

The portal is a user interface and orchestration layer. It:

- Renders blueprints into Terraform configurations
- Creates Git artifacts (branches, commits, PRs)
- Tracks provisioning job status
- Provides catalog browsing and resource discovery

The portal does not hold authoritative state. If the portal were unavailable, infrastructure would remain intact and manageable via Git and Terraform directly.

### What the Portal Executes

The portal initiates workflows but does not execute infrastructure changes directly:

- GitHub Actions executes Terraform apply
- ArgoCD reconciles Kubernetes resources
- Crossplane provisions cloud resources via claims

The portal triggers; other systems execute.

## Design Philosophy

### Opinionated Areas

The platform enforces strong opinions on:

- **Naming conventions**: Lowercase alphanumeric with hyphens, length limits enforced
- **Required tags**: Owner, cost center, and environment tags are mandatory
- **Environment progression**: Dev → QA → Staging → Prod with escalating approval requirements
- **State isolation**: Each environment has independent Terraform state
- **Blueprint structure**: Fixed schema for variables, outputs, and policies

### Flexible Areas

The platform allows flexibility in:

- Blueprint variable values (within schema constraints)
- Resource configurations exposed by blueprints
- Environment selection (where policy allows)
- Timing of provisioning requests

### Automation Boundaries

Automation handles:

- Branch and PR creation
- Terraform plan execution
- Infrastructure apply on merge
- Drift detection
- Notification delivery
- Catalog registration

Automation does not:

- Merge pull requests automatically (except dev environment)
- Override policy violations
- Modify blueprint definitions
- Delete resources without explicit request
- Bypass approval requirements

### Human Approval Expectations

| Environment | Approvals Required | Additional Constraints |
|-------------|-------------------|------------------------|
| Dev | None | Auto-merge enabled |
| QA | 1 | Business hours preferred |
| Staging | 1 | Must match QA-tested configuration |
| Prod | 2 | Business hours required, change control |

Approval requirements are enforced via GitHub branch protection rules and cannot be bypassed by the portal.
