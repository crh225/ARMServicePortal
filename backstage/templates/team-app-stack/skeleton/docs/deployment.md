# Deployment

## CI/CD Pipeline

Deployments are fully automated via GitHub Actions and ArgoCD.

### Pipeline Flow

```
Push to main
     │
     ▼
┌─────────────────┐
│  GitHub Actions │
│  - npm install  │
│  - npm test     │
│  - npm build    │
│  - docker build │
│  - docker push  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     ArgoCD      │
│  - Detect image │
│  - Sync to K8s  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Kubernetes    │
│  - Rolling      │
│    update       │
└─────────────────┘
```

## Triggering a Deployment

Simply push to the `main` branch:

```bash
git add .
git commit -m "feat: my new feature"
git push origin main
```

The pipeline will:
1. Run tests
2. Build the application
3. Build and push Docker image to GHCR
4. ArgoCD will detect the new image and deploy

## Manual Sync

If needed, you can manually trigger a sync in ArgoCD:

```bash
argocd app sync team-${{ values.teamName }}-${{ values.appName }}
```

Or via the ArgoCD UI at [argocd.chrishouse.io](https://argocd.chrishouse.io/applications/team-${{ values.teamName }}-${{ values.appName }})

## Rollback

### Via ArgoCD UI

1. Go to [ArgoCD](https://argocd.chrishouse.io/applications/team-${{ values.teamName }}-${{ values.appName }})
2. Click "History and Rollback"
3. Select a previous revision
4. Click "Rollback"

### Via CLI

```bash
# List revision history
argocd app history team-${{ values.teamName }}-${{ values.appName }}

# Rollback to specific revision
argocd app rollback team-${{ values.teamName }}-${{ values.appName }} <revision>
```

### Via kubectl

```bash
# View rollout history
kubectl rollout history deployment/${{ values.appName }} -n ${{ values.namespace }}

# Rollback to previous
kubectl rollout undo deployment/${{ values.appName }} -n ${{ values.namespace }}

# Rollback to specific revision
kubectl rollout undo deployment/${{ values.appName }} -n ${{ values.namespace }} --to-revision=<revision>
```

## Monitoring Deployment

### Check Deployment Status

```bash
kubectl rollout status deployment/${{ values.appName }} -n ${{ values.namespace }}
```

### View Pods

```bash
kubectl get pods -n ${{ values.namespace }} -l app=${{ values.appName }}
```

### View Events

```bash
kubectl get events -n ${{ values.namespace }} --sort-by='.lastTimestamp'
```

## Environment Promotion

This stack is deployed to: **${{ values.environment }}**

To deploy to other environments, create a new stack via Backstage with the appropriate environment setting.

## Helm Values

Deployment configuration is managed in `helm/values.yaml`:

```yaml
replicaCount: 2
image:
  repository: ghcr.io/crh225/team-${{ values.teamName }}-${{ values.appName }}
  tag: latest
  pullPolicy: Always
service:
  port: ${{ values.port }}
ingress:
  enabled: true
  host: ${{ values.domain }}
```

To customize, edit the values file and push to trigger a deployment.

## Secrets Management

{%- if values.includeKeyVault %}

Secrets are stored in Azure Key Vault (`${{ values.keyVaultName }}`).

To add a secret:

```bash
az keyvault secret set \
  --vault-name ${{ values.keyVaultName }} \
  --name "my-secret" \
  --value "secret-value"
```

Secrets are synced to Kubernetes via External Secrets Operator.
{%- else %}

For secrets, consider:

1. Adding Key Vault to your stack (recreate with `includeKeyVault: true`)
2. Using Kubernetes Secrets directly
3. Using sealed-secrets for GitOps-friendly secret management
{%- endif %}
