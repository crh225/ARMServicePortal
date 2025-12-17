# ARM Service Portal – Context

## Platform Overview

The ARM Service Portal is a self-service, GitOps-driven platform for provisioning approved Azure infrastructure. End-users interact with a catalog of pre-approved blueprints and request resources without direct Azure access. All changes are tracked in Git with full audit trails.

The platform exists to:

- Enable infrastructure self-service without granting cloud console access
- Enforce organizational policies at provisioning time
- Maintain a single source of truth for all infrastructure in version control
- Provide visibility into deployment status and resource inventory

The intended users are application teams who need Azure resources but should not have direct Azure portal access or Terraform expertise.

## Operating Model

### Human-Driven Responsibilities

- Selecting blueprints and providing input variables
- Reviewing pull requests before merge (approval gates)
- Approving production promotions
- Managing blueprint definitions and policy configurations
- Responding to drift detection alerts

### Automated Responsibilities

- Rendering Terraform modules from blueprint definitions
- Creating branches, commits, and pull requests in GitHub
- Running Terraform plan and surfacing results in PR comments
- Applying infrastructure changes on merge to main
- Detecting configuration drift on schedule
- Broadcasting deployment status via real-time notifications
- Registering provisioned resources in the Backstage catalog

### Control Boundaries

Decision-making authority resides with humans at these points:

- Blueprint catalog curation (what resources can be provisioned)
- Policy definition (what constraints apply per environment)
- Pull request approval (whether a change proceeds)
- Production promotion approval (two-reviewer gate)

Automation owns execution within those boundaries but cannot bypass approval gates or modify policy configurations.

## Scope

The platform is responsible for:

- Self-service provisioning of Azure resources via approved blueprints
- GitOps-based infrastructure lifecycle management
- Policy enforcement at request time
- Deployment status visibility and notifications
- Resource catalog and discovery via Backstage

## Non-Goals

The platform explicitly does not:

- Provide direct Azure portal or CLI access
- Allow arbitrary Terraform module authoring by end-users
- Manage Azure subscriptions, billing, or identity
- Handle application deployment or container orchestration (delegated to ArgoCD)
- Provide secrets management UI (delegated to Azure Key Vault)
- Monitor application health or performance (delegated to observability stack)

## Ecosystem Position

The ARM Service Portal sits between users and Azure, acting as a policy-enforced gateway. It integrates with:

- **GitHub** as the source of truth and workflow engine
- **Backstage** as the developer portal and catalog
- **ArgoCD** for Kubernetes-native GitOps reconciliation
- **Crossplane** for Kubernetes-native infrastructure claims
- **Azure** as the target cloud platform

The portal is an orchestration layer, not a replacement for the underlying systems.
