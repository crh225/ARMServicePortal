# ${{ values.site_name }}

${{ values.description }}

## Getting Started

### Prerequisites
- Node.js ${{ values.node_version }}
- npm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:8000

### Building

```bash
# Build for production
npm run build

# Serve production build locally
npm run serve
```

## Deployment

This site is automatically deployed via GitOps:

1. Push to `main` branch
2. GitHub Actions builds the Gatsby site
3. Docker image is created and pushed to GHCR
4. ArgoCD syncs to AKS cluster
5. Available at: https://${{ values.domain }}

## Structure

```
.
├── src/              # Gatsby source files
├── content/          # Blog posts (markdown)
├── helm/             # Kubernetes Helm chart
├── .github/          # CI/CD workflows
├── Dockerfile        # Multi-stage build
└── nginx.conf        # Nginx configuration
```
