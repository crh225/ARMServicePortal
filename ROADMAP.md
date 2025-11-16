# ARMServicePortal Roadmap

## Phase 1: MVP Core Features
- [x] Blueprint catalog
- [x] Self-service provisioning
- [x] GitHub PR creation
- [x] Jobs list and details
- [x] Terraform module visualization
- [x] Basic error handling

## Phase 2: Resource Management (Current)

### High Priority
- [X] **Resource Inventory Page**
  - List all deployed resources (from merged PRs)
  - Filter by environment, blueprint, status(done)
  - Quick actions: Update, Delete, View in GitHub

- [X] **Update Existing Resources**
  - "Edit" button on deployed resources
  - Pre-fill form with current values
  - Create new PR with updated module

- [X] **Delete/Destroy Resources**
  - "Delete" button creates PR removing the .tf file
  - Confirmation dialog with impact preview
  - Terraform destroy runs on merge

- [ ] **Auto-refresh Job Status**
  - Poll GitHub API every 30s for active jobs
  - Real-time status updates
  - Browser notifications on completion

### Medium Priority
- [ ] **PR Review Integration**
  - Show PR review status (approvals, changes requested)
  - Display reviewers and their status
  - "Request Review" button (tags GitHub team)

- [ ] **Plan Output Display**
  - Parse Terraform plan from PR comments
  - Show resources to be created/modified/destroyed
  - Highlight potential issues

- [ ] **Job Filtering & Search**
  - Search by blueprint, environment, author
  - Date range filter
  - Status filter (open/merged/closed)

## Phase 3: Workflow & Approvals

### Authentication Options
**Option A: No-Auth (GitHub-based)**
- Use PR author for identity
- GitHub repo settings enforce approvals
- Portal is read-only, GitHub is source of truth

**Option B: Simple API Keys**
- Generate keys via env vars
- Store in localStorage
- Basic role checking (admin/user)

**Option C: GitHub OAuth**
- Full GitHub authentication
- Use GitHub teams for authorization
- Seamless user experience

### Approval Workflow
- [ ] Define approval rules per blueprint
- [ ] Visual approval status
- [ ] Email/Slack notifications for approvals
- [ ] Override capability for emergencies

## Phase 4: Advanced Features

### Cost Management
- [ ] Integrate Infracost for cost estimates
- [ ] Show estimated monthly cost before submit
- [ ] Cost dashboard by environment
- [ ] Budget alerts

### Observability
- [ ] Deployment success/failure metrics
- [ ] Resource health dashboard
- [ ] Audit log of all changes
- [ ] Integration with monitoring tools

### Developer Experience
- [ ] Blueprint templates/wizards
- [ ] Validation before submit
- [ ] Dry-run mode (plan without create)
- [ ] Rollback capability
- [ ] Scheduled deployments

## Phase 5: Enterprise Features

### Multi-tenancy
- [ ] Organization/team isolation
- [ ] Per-team quotas and limits
- [ ] Delegated administration

### Compliance & Governance
- [ ] Policy enforcement (OPA/Sentinel)
- [ ] Compliance scanning
- [ ] Approval chains
- [ ] Change windows

### Advanced Automation
- [ ] Automated testing of infrastructure
- [ ] Progressive rollouts
- [ ] Blue/green deployments
- [ ] Canary deployments

## Technical Debt & Improvements

### Testing
- [ ] Unit tests for backend services
- [ ] Integration tests for API
- [ ] E2E tests for frontend
- [ ] GitHub Actions test workflow

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide
- [ ] Blueprint development guide
- [ ] Deployment guide

### Performance
- [ ] Caching layer for GitHub API
- [ ] Pagination for large job lists
- [ ] Optimistic UI updates
- [ ] Background job processing

## Ideas for Future Consideration

- Multi-cloud support (AWS, GCP)
- Infrastructure import (existing resources)
- Disaster recovery automation
- Resource tagging enforcement
- Dependency management (resource relationships)
- GitOps sync status
- Secrets management integration
- Terraform state management UI

---



