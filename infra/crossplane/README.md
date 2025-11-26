# Crossplane Setup for ARM Service Portal

This directory contains Crossplane configurations for Kubernetes-native infrastructure provisioning.

## Architecture

```
ARM Portal (UI)
    ↓
Backend API
    ↓
Kubernetes API (AKS)
    ↓
Crossplane Controller
    ↓
Azure Resources
```

## Prerequisites

- AKS cluster deployed (see `../environments/dev/aks-crossplane.tf`)
- `kubectl` configured to access the cluster
- `helm` installed

## Setup Steps

### 1. Deploy AKS Cluster

```bash
cd ../environments/dev
terraform init
terraform apply -target=azurerm_resource_group.aks_crossplane
terraform apply -target=azurerm_kubernetes_cluster.crossplane
```

### 2. Get AKS Credentials

```bash
az aks get-credentials \
  --resource-group rg-armportal-aks-crossplane-dev \
  --name aks-armportal-crossplane-dev \
  --overwrite-existing
```

### 3. Install Crossplane

```powershell
# From this directory
.\scripts\install-crossplane.ps1
```

### 4. Install Azure Provider

```bash
kubectl apply -f providers/azure-provider.yaml

# Wait for provider to be healthy
kubectl get providers
```

### 5. Configure Azure Provider

```bash
kubectl apply -f providers/azure-provider-config.yaml
```

### 6. Deploy Compositions

```bash
kubectl apply -f compositions/
kubectl apply -f xrds/
kubectl apply -f function-patch-and-transform.yaml
```

### 7. Install Argo CD UI (Optional)

```powershell
# From this directory
.\scripts\install-argocd.ps1
```

This installs Argo CD for visualizing and managing Crossplane resources through a web UI.

## Usage

### Provision a Storage Account via Crossplane

```bash
kubectl apply -f examples/storage-account.yaml
```

### Check Resource Status

```bash
kubectl get storageaccount
kubectl get managed
```

## Compositions Available

- **Storage Account** (`compositions/storage-composition.yaml`)
  - Creates Azure Storage Account with configurable replication

## Comparison: Terraform vs Crossplane

### Terraform (Current)
```hcl
resource "azurerm_storage_account" "example" {
  name                     = "mystorageaccount"
  resource_group_name      = "my-rg"
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

### Crossplane (New)
```yaml
apiVersion: portal.armportal.io/v1alpha1
kind: XStorageAccount
metadata:
  name: my-storage
spec:
  parameters:
    replicationType: LRS
    tier: Standard
```

## Benefits of Crossplane

1. **Kubernetes-Native**: Resources managed as K8s objects
2. **GitOps Ready**: Integrate with ArgoCD/Flux easily
3. **Unified Control Plane**: Single API for all infrastructure
4. **Better Drift Detection**: Kubernetes reconciliation loops
5. **RBAC**: Leverage Kubernetes RBAC for access control

## Migration Path from Terraform

1. **Phase 1**: Run Terraform and Crossplane in parallel
2. **Phase 2**: Import existing Terraform resources into Crossplane
3. **Phase 3**: Gradually migrate new resources to Crossplane
4. **Phase 4**: Deprecate Terraform workflows

## Cost

AKS Cluster (Standard_B2s): ~$30/month
- 1 node, 2 vCPU, 4GB RAM
- Sufficient for Crossplane demo

## Troubleshooting

### Check Crossplane Pods
```bash
kubectl get pods -n crossplane-system
```

### Check Provider Status
```bash
kubectl describe provider provider-azure-storage
```

### View Resource Events
```bash
kubectl describe storageaccount my-storage
```

### Crossplane Logs
```bash
kubectl logs -n crossplane-system -l app=crossplane
```

## Argo CD UI

Argo CD provides a web UI for visualizing and managing Crossplane resources.

### Access Argo CD

```powershell
# Port-forward to access the UI (run in separate terminal)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then navigate to: https://localhost:8080

### Features

- **Resource Visualization**: See Crossplane resources as a dependency tree
- **Health Status**: Monitor resource health and sync status
- **GitOps**: Connect Git repositories for automated deployments
- **RBAC**: Role-based access control for teams
- **Audit Logs**: Track all changes to resources
