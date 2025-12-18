# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Team ${{ values.teamName }}                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   GitHub     │───▶│   ArgoCD     │───▶│  Kubernetes  │      │
│  │   (GitOps)   │    │   (CD)       │    │  (Runtime)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                 │               │
│                                                 ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Azure Resources                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │  Resource  │  │  Storage   │  │  Key Vault │  ...     │  │
│  │  │   Group    │  │  Account   │  │            │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Application Layer

| Component | Description |
|-----------|-------------|
| **${{ values.appName }}** | {% if values.app_type == 'static' %}Static site built with Node.js and served via nginx{% else %}Node.js server application{% endif %} |
| **Container Image** | `ghcr.io/crh225/team-${{ values.teamName }}-${{ values.appName }}:latest` |
| **Port** | ${{ values.port }} |

### Infrastructure Layer

All Azure resources are managed declaratively via Crossplane:

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `${{ values.resourceGroupName }}` | Container for all Azure resources |
{%- if values.includeStorage %}
| Storage Account | `${{ values.storageAccountName }}` | Blob storage, file shares, queues |
{%- endif %}
{%- if values.includeKeyVault %}
| Key Vault | `${{ values.keyVaultName }}` | Secrets and certificate management |
{%- endif %}
{%- if values.includeAppConfig %}
| App Configuration | `${{ values.appConfigName }}` | Feature flags and configuration |
{%- endif %}

### GitOps Layer

ArgoCD manages deployment through an App-of-Apps pattern:

```
team-${{ values.teamName }} (Parent App)
├── team-${{ values.teamName }}-infra (Crossplane claims)
└── team-${{ values.teamName }}-${{ values.appName }} (Application deployment)
```

## Data Flow

1. **Developer** pushes code to GitHub
2. **GitHub Actions** builds container image and pushes to GHCR
3. **ArgoCD** detects changes and syncs to Kubernetes
4. **Crossplane** reconciles Azure infrastructure
5. **Ingress** routes traffic to the application
