# Azure Self-Service Portal (GitOps + Infrastructure as Code)

## Overview
The Azure Self-Service Portal is a lightweight, extensible platform designed to enable end-users to safely provision approved Azure resources through a GitOps workflow. Instead of granting users direct access to Azure, the portal automates infrastructure delivery through pull requests, GitHub Actions, Terraform, and Crossplane.

This ensures:
- Security — No direct Azure access for end users
- Governance — All changes tracked through Git
- Consistency — Reproducible infrastructure modules
- Automation — CI/CD handles validation and deployment
- Transparency — Users can watch deployments live

---

## Goals
The primary goal of this project is to provide a self-service, auditable, GitOps-driven deployment experience.

The portal allows users to:
- Browse a catalog of approved blueprints (Terraform modules or Crossplane Claims)
- Provide parameters dynamically via the UI
- Automatically generate a new Git branch containing the requested infrastructure
- Open a pull request back to the infrastructure repository
- View real-time deployment status (Terraform Plan/Apply or Crossplane sync)
- Track created resources and outputs

Infrastructure is provisioned via two complementary approaches:
- **Terraform** — GitHub Actions executes plan/apply for Azure resources
- **Crossplane** — Kubernetes-native provisioning for claims (e.g., Redis, databases) that sync automatically via GitOps

---

## Architecture
The system consists of four core components:

### 1. Frontend (React/Vite)
- Provides UI for selecting blueprints and submitting requests
- Shows job history and real-time status
- Fetches data from the backend API
- Hosted on Azure Static Web Apps with CDN

### 2. Backend (Node.js)
- Acts as a broker between the UI and GitHub
- Generates module files based on blueprint definitions
- Creates branches, commits, and pull requests via the GitHub App installation
- Extracts Terraform outputs from GitHub Action comments
- Normalizes job history for the UI
- Uses Redis for distributed caching across pods

### 3. Kubernetes Platform (AKS)
- **Argo Rollouts** — Blue-green deployments with automated analysis
- **Istio Service Mesh** — Traffic management, mTLS, observability
- **Crossplane** — GitOps-driven infrastructure provisioning
- **Redis** — Shared cache for session and data caching
- **Cert-Manager** — Automated TLS certificate management via Let's Encrypt

### 4. Infrastructure (Terraform + GitHub Actions)
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
                                    +---------------------------+
                                    |     Azure Static Web      |
                                    |     Apps (Frontend)       |
                                    |     React / Vite          |
                                    +-------------+-------------+
                                                  |
                                                  | HTTPS
                                                  v
+-------------------------------------------------------------------------------------------+
|                              Azure Kubernetes Service (AKS)                               |
|  +-------------------------------------------------------------------------------------+  |
|  |                              Istio Service Mesh                                     |  |
|  |  +---------------------------+    +---------------------------+                     |  |
|  |  |    Ingress Gateway        |--->|   Backend Service         |                     |  |
|  |  |    (TLS Termination)      |    |   (Argo Rollouts)         |                     |  |
|  |  +---------------------------+    +-------------+-------------+                     |  |
|  |                                                 |                                   |  |
|  |                    +----------------------------+----------------------------+      |  |
|  |                    |                            |                            |      |  |
|  |                    v                            v                            v      |  |
|  |  +------------------+         +------------------+         +------------------+     |  |
|  |  |  Active Pods     |         |  Preview Pods    |         |  Redis Cluster   |     |  |
|  |  |  (Blue/Green)    |         |  (Canary)        |         |  (Cache)         |     |  |
|  |  +------------------+         +------------------+         +------------------+     |  |
|  +-------------------------------------------------------------------------------------+  |
|                                                                                           |
|  +----------------------------------+    +----------------------------------+             |
|  |  Crossplane                      |    |  Cert-Manager                   |             |
|  |  (Infrastructure Provisioning)   |    |  (TLS Certificates)             |             |
|  +----------------------------------+    +----------------------------------+             |
+-------------------------------------------------------------------------------------------+
              |                                              |
              | GitHub App API                               | Azure Resource Graph
              v                                              v
+-------------------------------+              +-------------------------------+
|      GitHub Repository        |              |         Azure                 |
|  - Terraform modules          |              |  - Container Registry         |
|  - GitHub Actions (CI/CD)     |              |  - Key Vault (Secrets)        |
|  - PR labeling + outputs      |              |  - Blob Storage (TF State)    |
+-------------------------------+              +-------------------------------+
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
The backend runs on AKS with the following components:
- **Argo Rollouts** — Blue-green deployment with pre/post analysis
- **Istio** — Service mesh for traffic routing and mTLS
- **Redis** — Distributed caching (deployed via Crossplane)
- **Secrets** — Synced from Azure Key Vault via CSI driver

Deployments are triggered via GitHub Actions on push to main.

### 4. Frontend Deployment
```bash
npm run build
```
Deployed to Azure Static Web Apps via GitHub Actions. The build uses `VITE_API_URL` to configure the backend endpoint.

---

## Contributor Guide

### Project Structure
```
/portal
  /frontend          # React/Vite SPA
  /backend           # Node.js API (DDD architecture)
/infra
  /modules           # Terraform modules (blueprints)
  /environments      # Per-environment Terraform configs
  /crossplane        # Kubernetes infrastructure manifests
    /cluster-setup   # Argo, Istio, Cert-Manager configs
    /apps            # Application deployments (Rollouts)
    /redis           # Redis cluster via Crossplane
/.github
  /workflows         # CI/CD pipelines
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

