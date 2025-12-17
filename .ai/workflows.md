# ARM Service Portal – Workflows

## Execution Model

### How Intent Is Expressed

Users express intent through:

- Selecting a blueprint from the catalog
- Providing required and optional variables
- Choosing a target environment
- Submitting a provisioning request

Intent is captured as a structured request containing blueprint ID, environment, and variable values.

### How Intent Is Validated

Before execution, the system validates:

- Blueprint exists and is active
- Target environment is allowed for the blueprint
- All required variables are provided
- Variable values conform to type and constraint rules
- Naming conventions are satisfied
- Required tags are present or can be auto-filled
- Cost estimates are within thresholds (if configured)

Validation failures reject the request with specific error messages. No partial execution occurs.

### How Intent Is Executed

Validated requests proceed through the following fixed sequence.  
Steps may not be reordered, skipped, or conditionally bypassed.

1. Branch creation in GitHub (feature branch)
2. Terraform configuration rendering from blueprint template
3. Commit to the feature branch
4. Pull request creation targeting main
5. Terraform plan execution via GitHub Actions
6. Plan results posted as PR comment
7. Human review and approval (per environment requirements)
8. Merge to main branch
9. Terraform apply execution via GitHub Actions
10. Apply results posted as PR comment
11. Webhook notification to portal backend
12. Real-time status broadcast to frontend

## Provisioning Workflow

### Request Phase

User submits provisioning request via portal UI or Backstage template action.

Backend receives request and performs synchronous validation against policies.

If validation fails, request is rejected immediately with error details.

If validation passes, request proceeds to execution phase.

### Execution Phase

Backend authenticates to GitHub via GitHub App.

Backend creates feature branch: `requests/{env}/{blueprint}-{request-id}`

Backend renders Terraform configuration from blueprint template with user-provided variables.

Backend commits rendered configuration to feature branch.

Backend creates pull request from feature branch to main.

Backend returns PR URL to user.

### Review Phase

GitHub Actions triggers on PR creation.

Terraform init and plan execute automatically.

Plan output is posted as PR comment for human review.

Reviewers evaluate the plan and approve or request changes.

For dev environment, auto-merge may proceed for human-initiated requests only.

For other environments, required approvals must be obtained.

### Apply Phase

On merge to main, GitHub Actions triggers apply workflow.

Terraform apply executes with the approved configuration.

Apply output is posted as PR comment.

Webhook fires to Azure Function with workflow completion status.

### Notification Phase

Azure Function relays webhook to RabbitMQ.

Backend consumes message and updates job status.

Status is broadcast via Server-Sent Events to connected frontends.

Resource is registered in Backstage catalog via catalog-info.yaml.

## Change and Update Workflow

### Proposing Updates

Updates to existing resources follow the same workflow as initial provisioning.

User selects the resource and modifies variable values.

Backend creates a new branch and PR with updated configuration.

Terraform plan shows the delta between current and desired state.

### Applying Updates

Updates require the same approval gates as initial provisioning.

Terraform apply modifies resources in place where possible.

Destructive changes are highlighted in the plan for explicit human review.

### Drift Handling

Scheduled workflows run terraform plan against each environment.

If drift is detected (actual state differs from Git), an alert is raised.

Drift is not auto-corrected.

Human review determines whether to:

- Update Git to match actual state (accept drift)
- Apply Terraform to restore desired state (correct drift)
- Investigate root cause of unexpected changes

### Rollback Approach

Rollback is performed by reverting the Git commit that introduced the change.

A new PR is created with the reverted configuration.

Standard review and approval process applies.

Terraform apply restores the previous state.

State file backups are available if state corruption occurs.

## Read-Only and Observability Workflow

### Information Surfacing

The portal surfaces:

- Blueprint catalog with descriptions and cost estimates
- Provisioning job history with status and PR links
- Resource inventory with current state
- Real-time deployment notifications
- Terraform plan and apply outputs via PR comments

### Derived vs Authoritative Data

| Data | Source | Authority |
|------|--------|-----------|
| Blueprint definitions | Portal config | Authoritative |
| Job status | Portal database | Derived from GitHub |
| Resource list | Backstage catalog | Derived from Git |
| Resource state | Terraform state | Authoritative |
| Actual Azure state | Azure APIs | Authoritative |

### Intentionally Unavailable Actions

The portal does not provide:

- Direct Azure resource modification
- Terraform state manipulation
- Secret value viewing or editing
- Policy override or bypass
- Approval requirement modification

## Failure and Recovery Workflow

### Automation Failure Points

| Phase | Failure Mode | System Response |
|-------|--------------|-----------------|
| Validation | Policy violation | Request rejected, error returned |
| Branch creation | GitHub API error | Request failed, user notified |
| Plan execution | Terraform error | PR blocked, error in comment |
| Apply execution | Terraform error | Workflow fails, state unchanged |
| Notification | Webhook failure | Retry with backoff, eventual consistency |

### Where Execution Stops

Execution halts and requires human intervention when:

- Terraform plan fails
- Terraform apply fails
- Required approvals are not obtained
- Policy validation fails

Partial state changes from failed applies are captured in Terraform state and visible in subsequent plans.

### Recovery Procedures

Assistive analysis of failures is permitted in a read-only capacity.

**Plan failure**  
Fix configuration in Git, push new commit, re-run workflow.

**Apply failure**  
Investigate error, fix configuration or Azure quota, re-run workflow. Terraform resumes from partial state.

**State corruption**  
Restore from backup in blob storage using a controlled, manual procedure. Re-import resources if necessary.

**Stuck PR**  
Close PR and create a new provisioning request. Orphaned branches may be cleaned up.

**Notification pipeline failure**  
Jobs complete successfully; status updates are eventually consistent once the pipeline recovers.

All recovery actions flow through Git. No out-of-band fixes are permitted.
