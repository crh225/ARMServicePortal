# ${{ values.service_name }}

${{ values.description }}
{% if values.ingress_enabled %}
## Live URL

**https://${{ values.service_name }}.chrishouse.io**
{% endif %}

## Overview

This is a Node.js ${{ values.node_version }} microservice deployed to AKS via GitOps.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/crh225/${{ values.service_name }}.git
cd ${{ values.service_name }}

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Architecture

```
${{ values.service_name }}/
├── src/
│   └── index.ts          # Main application entry point
├── helm/                  # Kubernetes Helm chart
│   ├── templates/
│   └── values.yaml
├── Dockerfile            # Container image definition
└── .github/workflows/    # CI/CD pipelines
```

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/health` | Liveness probe - returns 200 if service is alive |
| `/ready` | Readiness probe - returns 200 when ready to accept traffic |

## Owner

This service is owned by **${{ values.owner }}**.
