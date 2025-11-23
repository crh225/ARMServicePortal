# Azure Self-Service Portal (GitOps + Terraform)

## Overview
The Azure Self-Service Portal is a lightweight, extensible platform designed to enable end-users to safely provision approved Azure resources through a GitOps workflow. Instead of granting users direct access to Azure or Terraform, the portal automates infrastructure delivery entirely through pull requests, GitHub Actions, and Terraform.

This ensures:
- Security — No direct Azure access for end users
- Governance — All changes tracked through Git
- Consistency — Reproducible Terraform modules
- Automation — CI/CD handles validation and deployment
- Transparency — Users can watch deployments live as Terraform runs

---

## Goals
The primary goal of this project is to provide a self-service, auditable, GitOps-driven deployment experience.

The portal allows users to:
- Browse a catalog of approved blueprints (Terraform modules)
- Provide parameters dynamically via the UI
- Automatically generate a new Git branch containing the requested module
- Open a pull request back to the infrastructure repository
- View real-time deployment status (Plan and Apply)
- Track created resources and Terraform outputs

All provisioning is performed via Terraform inside GitHub Actions — no resources are deployed directly from the UI backend.

---

## Architecture
The system consists of three core components:

### 1. Frontend (React/Vite)
- Provides UI for selecting blueprints and submitting requests
- Shows job history and real-time status
- Fetches data from the backend API

### 2. Backend (Node.js)
- Acts as a broker between the UI and GitHub
- Generates module files based on blueprint definitions
- Creates branches, commits, and pull requests via the GitHub App installation
- Extracts Terraform outputs from GitHub Action comments
- Normalizes job history for the UI

### 3. Infrastructure (Terraform + GitHub Actions)
- Terraform modules live in infra/environments/<env>
- GitHub Actions executes:
  - terraform init
  - terraform plan
  - terraform apply (on merge)
- Applies labels to PRs to show plan/apply status
- Posts Terraform outputs back to the PR as comments

---

## Architecture Diagram

```text
+------------------------+        +----------------------------+
|        Frontend        | <----> |         Backend API        |
|  React / Vite          |        |  Node.js + GitHub App      |
+------------------------+        +----------------------------+
             |                                   |
             | REST API                           | GitHub App API
             v                                   v
+---------------------------------------------------------------+
|                         GitHub Repository                     |
|  - Terraform modules                                         |
|  - GitHub Actions (Plan & Apply)                             |
|  - PR labeling + TF outputs comments                         |
+---------------------------------------------------------------+
             |                                   |
             | Terraform Apply                   |
             v                                   v
+------------------------+         +-----------------------------+
|        Azure           |         | Terraform Remote Backend   |
|  Container Apps        | <------ | State Storage              |
|  Container Registry    |         | (e.g., Azure Blob)         |
+------------------------+         +-----------------------------+
```

---

## Screenshots

### Blueprint Catalog
<img width="1303" height="588" alt="image" src="https://github.com/user-attachments/assets/9265328f-6787-45dd-8bbd-d5ef669e58d5" />

### Pull Request View
<img width="1301" height="800" alt="image" src="https://github.com/user-attachments/assets/b1d4bf7c-c95e-48a2-9048-e8820bed02ed" />

### Job Status Dashboard
<img width="1277" height="580" alt="image" src="https://github.com/user-attachments/assets/6fd83d0f-bf39-4b76-b0ee-38e99022cb8f" />

### Outputs Viewer
<img width="526" height="281" alt="image" src="https://github.com/user-attachments/assets/cc57591e-51bb-4562-8078-b032d4abc45e" />


---

## Workflow Diagram

```text
User Request
    |
    v
+-------------------+      
| Frontend Portal   | 
+-------------------+
    | POST /provision
    v
+---------------------------+   
| Backend API (Node.js)     | 
+---------------------------+
    | Creates branch and PR
    v
+---------------------------+
| GitHub Actions (Plan)     |
+---------------------------+
    | Labels PR
    | Waits for merge
    v
+---------------------------+
| GitHub Actions (Apply)    |
+---------------------------+
    | Posts outputs
    v
+---------------------------+
| Frontend Jobs Dashboard   |
+---------------------------+
```

---

## How the GitHub App Works

### Authentication Flow
1. Backend loads GH_APP_PRIVATE_KEY_BASE64
2. Signs a JWT
3. Exchanges JWT for an installation access token
4. Uses token to:
   - Create branches
   - Commit files
   - Create pull requests
   - Read comments and labels

### Security Advantages
- Tokens auto-expire (60 minutes)
- No long-lived PATs
- Least privilege access
- Private key stored securely as an Azure secret

---

## Deployment Instructions

### 1. Terraform Setup
Define variables:
```hcl
variable "github_infra_owner" {}
variable "github_infra_repo" {}
variable "github_app_id" {}
variable "github_installation_id" {}
variable "github_app_private_key_base64" {}
```

Run:
```bash
terraform init
terraform apply
```

### 2. GitHub Secrets
Set:
- GH_INFRA_OWNER
- GH_INFRA_REPO
- GH_APP_ID
- GH_INSTALLATION_ID
- GH_APP_PRIVATE_KEY_BASE64
- Azure authentication variables

### 3. Backend Deployment
Terraform provisions:
- Container registry
- Log analytics
- Container app environment
- Backend API

### 4. Frontend Deployment
```bash
npm run build
```
Deploy to Azure Static Web Apps or Storage Static Website.

---

## Contributor Guide

### Project Structure
```
/portal
  /frontend
  /backend
/infra
  /modules
  /environments/dev|stage|prod
```

### Standards
- PRs must pass terraform plan
- Secrets must never be logged
- GH_* prefix required for GitHub App env vars

### Adding Blueprints
1. Add module under infra/modules
2. Update backend blueprint config
3. Rebuild UI

---

## Roadmap
- Done: Dynamic validation
- RBAC and permissions model
- Admin UI for blueprint management
- Done: Cost estimation integration
- Done: workflows with approval gates
- Done: Blueprint versioning
- Done: Notifications

---

