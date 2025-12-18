# ${{ values.teamName }} - ${{ values.appName }}

${{ values.description }}

## Overview

| Property | Value |
|----------|-------|
| Team | ${{ values.teamName }} |
| Environment | ${{ values.environment }} |
| Owner | ${{ values.owner }} |
| App URL | https://${{ values.domain }} |

## Infrastructure

This application stack includes the following Azure resources provisioned via Crossplane:

- **Resource Group**: `${{ values.resourceGroupName }}`
{%- if values.includeStorage %}
- **Storage Account**: `${{ values.storageAccountName }}`
{%- endif %}
{%- if values.includeKeyVault %}
- **Key Vault**: `${{ values.keyVaultName }}`
{%- endif %}
{%- if values.includeAppConfig %}
- **App Configuration**: `${{ values.appConfigName }}`
{%- endif %}

## Development

### Prerequisites

- Node.js ${{ values.node_version }}
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker

```bash
# Build the image
docker build -t ${{ values.appName }} .

# Run locally
docker run -p ${{ values.port }}:${{ values.port }} ${{ values.appName }}
```

## Deployment

This application uses GitOps for deployments:

1. Push changes to the `main` branch
2. GitHub Actions builds and pushes the Docker image to GHCR
3. ArgoCD automatically syncs the new image to Kubernetes

### ArgoCD Applications

- **Parent App**: [team-${{ values.teamName }}](https://argocd.chrishouse.io/applications/team-${{ values.teamName }})
- **Infrastructure**: [team-${{ values.teamName }}-infra](https://argocd.chrishouse.io/applications/team-${{ values.teamName }}-infra)
- **Application**: [team-${{ values.teamName }}-${{ values.appName }}](https://argocd.chrishouse.io/applications/team-${{ values.teamName }}-${{ values.appName }})

## Links

- [Live Site](https://${{ values.domain }})
- [ArgoCD](https://argocd.chrishouse.io/applications/team-${{ values.teamName }})
- [Azure Portal](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }})
- [Backstage Catalog](https://backstage.chrishouse.io/catalog/default/component/team-${{ values.teamName }}-${{ values.appName }})
