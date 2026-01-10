---
name: aks-cluster-management
description: Start, stop, and manage AKS clusters in the ARM Service Portal subscription. Use when the user wants to turn clusters on/off, check cluster status, or save costs by stopping compute.
license: MIT
metadata:
  author: crh225
  version: "1.0"
---

# AKS Cluster Management

Manage Azure Kubernetes Service clusters for cost optimization and operations.

## Clusters

| Cluster | Resource Group | Purpose |
|---------|----------------|---------|
| `aks-mgmt-hub` | `rg-landing-zone-hub` | Platform services (ArgoCD, Crossplane, Backstage) |
| `aks-app-spoke-hsn7p-0e18fb09d1f7` | `rg-landing-zone-dev` | Application workloads with Istio |
| `aks-shared-dev-m4vw8-20b76d3466de` | `rg-landing-zone-dev` | Shared development cluster |

## Operations

### Stop All Clusters

To stop all clusters and save costs:

```bash
az aks stop --name aks-mgmt-hub --resource-group rg-landing-zone-hub --no-wait
az aks stop --name aks-app-spoke-hsn7p-0e18fb09d1f7 --resource-group rg-landing-zone-dev --no-wait
az aks stop --name aks-shared-dev-m4vw8-20b76d3466de --resource-group rg-landing-zone-dev --no-wait
```

### Start All Clusters

```bash
az aks start --name aks-mgmt-hub --resource-group rg-landing-zone-hub --no-wait
az aks start --name aks-app-spoke-hsn7p-0e18fb09d1f7 --resource-group rg-landing-zone-dev --no-wait
az aks start --name aks-shared-dev-m4vw8-20b76d3466de --resource-group rg-landing-zone-dev --no-wait
```

### Check Status

```bash
az aks list --query "[].{name:name, resourceGroup:resourceGroup, powerState:powerState.code}" -o table
```

## Important Notes

### Before Stopping aks-mgmt-hub

The hub cluster runs Crossplane. Before stopping, delete the blocking webhook:

```bash
kubectl config use-context aks-mgmt-hub
kubectl delete validatingwebhookconfiguration crossplane-no-usages --ignore-not-found
```

### Cost Savings

- Stopped clusters do not incur compute costs
- Public IPs (~$4/month each) still bill when clusters are stopped
- Control plane is free tier on all clusters

### VM Sizes

| Cluster | VM Size | Monthly Cost (running) |
|---------|---------|----------------------|
| aks-mgmt-hub | Standard_B2ms | ~$60/month |
| aks-app-spoke | Standard_B2s | ~$30/month |
| aks-shared-dev | Standard_B2s | ~$30/month |
