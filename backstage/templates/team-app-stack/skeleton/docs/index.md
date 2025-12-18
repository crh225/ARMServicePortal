# ${{ values.teamName }} - ${{ values.appName }}

${{ values.description | default('Application stack for team ' + values.teamName) }}

## Overview

This is a complete application stack provisioned via Backstage, including:

- **Application**: Node.js {% if values.app_type == 'static' %}static site{% else %}server{% endif %} (`${{ values.appName }}`)
- **Infrastructure**: Azure resources managed by Crossplane
- **Deployment**: GitOps via ArgoCD

## Quick Links

| Resource | Link |
|----------|------|
| Live Site | [https://${{ values.domain }}](https://${{ values.domain }}) |
| GitHub Repo | [team-${{ values.teamName }}-${{ values.appName }}](https://github.com/crh225/team-${{ values.teamName }}-${{ values.appName }}) |
| ArgoCD | [team-${{ values.teamName }}](https://argocd.chrishouse.io/applications/team-${{ values.teamName }}) |
| Azure Portal | [Resource Group](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }}) |

## Team Information

- **Team**: ${{ values.teamName }}
- **Environment**: ${{ values.environment }}
- **Owner**: ${{ values.owner | default('user:default/guest') }}

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/crh225/team-${{ values.teamName }}-${{ values.appName }}.git
   cd team-${{ values.teamName }}-${{ values.appName }}
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:${{ values.port }}](http://localhost:${{ values.port }})
