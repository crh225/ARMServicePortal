# Secrets Management with Azure CSI Secrets Store Driver

This document explains how secrets are synced from Azure Key Vault to Kubernetes using the CSI Secrets Store Driver.

## Overview

The cluster uses the **Azure CSI Secrets Store Driver** to sync secrets from Azure Key Vault to Kubernetes. This is the recommended approach for AKS clusters as it provides:

- Native Azure integration via Managed Identity
- Automatic secret rotation (when pods restart)
- Secrets mounted as files AND synced to Kubernetes Secrets
- No additional operators required (built into AKS)

## Architecture

```
┌─────────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│   Azure Key Vault   │ ───► │  CSI Secrets Store   │ ───► │  Kubernetes Secret  │
│   (akvnotintf1)     │      │      Driver          │      │  (backend-secrets)  │
└─────────────────────┘      └──────────────────────┘      └─────────────────────┘
                                      │
                                      ▼
                             ┌──────────────────────┐
                             │   Pod Volume Mount   │
                             │  /mnt/secrets-store  │
                             └──────────────────────┘
```

## How It Works

1. **SecretProviderClass** defines which secrets to fetch from Key Vault
2. **Pod** mounts a CSI volume referencing the SecretProviderClass
3. **CSI Driver** authenticates to Azure using Managed Identity
4. **Secrets** are mounted as files in the pod AND synced to a Kubernetes Secret
5. **Other pods/jobs** can reference the Kubernetes Secret via `secretKeyRef`

## Key Vault Configuration

| Setting | Value |
|---------|-------|
| Key Vault Name | `akvnotintf1` |
| Resource Group | `test-not-in-tf-1` |
| Tenant ID | `354b7ce2-bca3-4af5-b19a-e05a09b68a7b` |
| Auth Method | VM Managed Identity |
| Identity ID | `3e50729e-4a1f-42ab-aebb-9f80758b8c8d` |

## SecretProviderClass Locations

### Backend Secrets (`armportal-backend` namespace)

**File:** `infra/kubernetes/armportal-backend/secret-provider-class.yaml`

Syncs the following secrets to `backend-secrets` Kubernetes Secret:

| Key Vault Secret | K8s Secret Key | Purpose |
|------------------|----------------|---------|
| `GH-APP-PRIVATE-KEY-BASE64` | `GH_APP_PRIVATE_KEY_BASE64` | GitHub App authentication |
| `GH-OAUTH-CLIENT-SECRET` | `GH_OAUTH_CLIENT_SECRET` | GitHub OAuth |
| `GITHUB-WEBHOOK-SECRET` | `GITHUB_WEBHOOK_SECRET` | Webhook validation |
| `ELASTICSEARCH-API-KEY` | `ELASTICSEARCH_API_KEY` | Elastic Cloud logging |
| `rabbitmq-url` | `RABBITMQ_URL` | RabbitMQ connection string |
| `app-config-endpoint` | `AZURE_APP_CONFIG_ENDPOINT` | Azure App Configuration |

### Cert-Manager Secrets (`cert-manager` namespace)

**File:** `infra/cluster-bootstrap/cert-manager-secret-provider-class.yaml`

Syncs Cloudflare API token for DNS-01 challenges:

| Key Vault Secret | Purpose |
|------------------|---------|
| `CLOUDFLARE-API-TOKEN` | DNS-01 certificate validation |

## Usage in Pods

### Option 1: Mount CSI Volume (required for sync)

At least one pod must mount the CSI volume to trigger secret sync:

```yaml
spec:
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: "azure-backend-secrets"
  containers:
    - name: app
      volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets-store"
          readOnly: true
```

### Option 2: Reference Kubernetes Secret

Once synced, other pods/jobs can reference via `secretKeyRef`:

```yaml
env:
  - name: GH_APP_PRIVATE_KEY_BASE64
    valueFrom:
      secretKeyRef:
        name: backend-secrets
        key: GH_APP_PRIVATE_KEY_BASE64
```

## Important Notes

1. **Pod Required for Sync**: The CSI driver only syncs secrets when a pod mounts the volume. If no pods are running with the CSI mount, secrets won't update.

2. **Secret Rotation**: Secrets are refreshed when pods restart. For automatic rotation, configure `rotationPollInterval` on the SecretProviderClass.

3. **Key Vault Naming**: Azure Key Vault doesn't allow underscores in secret names. Use hyphens in Key Vault (e.g., `GH-APP-PRIVATE-KEY-BASE64`) and map to underscores in Kubernetes.

4. **Managed Identity**: The CSI driver uses the AKS kubelet managed identity. Ensure it has `Key Vault Secrets User` role on the Key Vault.

## Troubleshooting

### Check if secrets are synced
```bash
kubectl get secret backend-secrets -n armportal-backend -o yaml
```

### Check CSI driver pods
```bash
kubectl get pods -n kube-system -l app=secrets-store-csi-driver
```

### Check SecretProviderClass status
```bash
kubectl describe secretproviderclass azure-backend-secrets -n armportal-backend
```

### View CSI driver logs
```bash
kubectl logs -n kube-system -l app=secrets-store-csi-driver -c secrets-store
```

## Adding New Secrets

1. Add secret to Azure Key Vault (`akvnotintf1`)
2. Update the SecretProviderClass `objects` array with the new secret
3. Update `secretObjects` to map it to a Kubernetes Secret key
4. Restart pods that mount the CSI volume to trigger sync
5. Reference the new key in your pod spec

## Related Files

- `infra/kubernetes/armportal-backend/secret-provider-class.yaml` - Backend secrets
- `infra/kubernetes/armportal-backend/rollout.yaml` - Pod with CSI mount
- `infra/cluster-bootstrap/cert-manager-secret-provider-class.yaml` - Cert-manager secrets
