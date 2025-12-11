# Deployment

## GitOps Workflow

This service uses a GitOps deployment model:

1. **Push to `main`** triggers the CI/CD pipeline
2. **CI** runs tests, lints, and builds the Docker image
3. **Image** is pushed to GitHub Container Registry (GHCR)
4. **ArgoCD manifest** is updated in the GitOps repository
5. **ArgoCD** automatically syncs the deployment to AKS

```mermaid
graph LR
    A[Push to main] --> B[GitHub Actions CI]
    B --> C[Build Docker Image]
    C --> D[Push to GHCR]
    D --> E[Update GitOps Repo]
    E --> F[ArgoCD Sync]
    F --> G[Deploy to AKS]
```

## Environments

| Environment | Namespace | URL |
|-------------|-----------|-----|
| Development | `dev` | https://${{ values.service_name }}.chrishouse.io |

## Kubernetes Resources

The Helm chart creates:

- **Deployment** - Runs ${{ values.min_replicas }}-${{ values.max_replicas }} replicas
- **Service** - ClusterIP on port ${{ values.port }}
- **HorizontalPodAutoscaler** - Scales based on CPU usage
{% if values.ingress_enabled %}- **Ingress** - Exposes at `${{ values.service_name }}.chrishouse.io` with TLS{% endif %}

## Resource Requests

| Resource | Request |
|----------|---------|
| CPU | ${{ values.cpu_request }} |
| Memory | ${{ values.memory_request }} |

## Monitoring

- **ArgoCD**: https://argocd.chrishouse.io
- **Application**: `${{ values.service_name }}`
- **Namespace**: `${{ values.initial_environment }}`

## Manual Deployment

If needed, deploy manually with Helm:

```bash
helm upgrade --install ${{ values.service_name }} ./helm \
  --namespace ${{ values.initial_environment }} \
  --set image.tag=<your-tag>
```
