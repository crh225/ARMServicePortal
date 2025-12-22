# Team Kubernetes Cluster Template

## Overview

This Backstage template provisions ephemeral AKS clusters for team development and testing using Crossplane.

## When to Use

- **Team development environments** - Isolated clusters for teams to experiment
- **Testing and validation** - Short-lived clusters for integration testing
- **Learning and training** - Clusters for learning Kubernetes
- **Prototyping** - Quick cluster provisioning for proof-of-concepts

## When NOT to Use

- **Production workloads** - Use the main app-spoke cluster or create a dedicated production cluster
- **Long-lived environments** - These are ephemeral clusters, not managed for long-term stability
- **Shared services** - Don't provision shared infrastructure like databases in ephemeral clusters

## Features

- **Spot instance support** - 60-80% cost savings for dev/test workloads
- **Autoscaling** - Configurable min/max node counts
- **GitOps workflow** - All changes tracked in Git via PRs
- **Quick provisioning** - ~5-10 minutes from PR merge to cluster ready
- **Easy cleanup** - Delete via Git PR (removes Azure resources automatically)

## Cost Considerations

### VM Pricing (per node, approximate monthly cost)

| VM Size | Regular | Spot (avg) | Savings |
|---------|---------|------------|---------|
| Standard_B2s (2 vCPU, 4 GB) | ~$30 | ~$6-12 | 60-80% |
| Standard_B2ms (2 vCPU, 8 GB) | ~$60 | ~$12-24 | 60-80% |
| Standard_D2s_v3 (2 vCPU, 8 GB) | ~$70 | ~$14-28 | 60-80% |

**Spot Instance Caveats:**
- Can be evicted with 30 seconds notice when Azure needs capacity
- Not recommended for production or stateful workloads
- Perfect for ephemeral dev/test environments

### Cost Control Tips

1. **Use Spot instances** for non-critical workloads (default in template)
2. **Enable autoscaling** to scale down during idle periods (default: enabled)
3. **Set low max node count** (default: 3 max)
4. **Delete clusters when done** - Don't leave unused clusters running
5. **Use Standard_B2s** for most dev work (default)

## How It Works

### Provisioning Flow

```
User fills form in Backstage
    ↓
Template generates Crossplane claim YAML
    ↓
GitHub PR created in ARMServicePortal repo
    ↓
Human reviews and merges PR
    ↓
ArgoCD syncs claim to mgmt-hub cluster
    ↓
Crossplane provisions AKS cluster in Azure (~5-10 min)
    ↓
Kubeconfig secret created in crossplane-system namespace
    ↓
Cluster ready to use
```

### Deletion Flow

```
Create PR removing claim directory
    ↓
Human reviews and merges PR
    ↓
ArgoCD removes claim from cluster
    ↓
Crossplane deletes AKS cluster from Azure
    ↓
All Azure resources cleaned up
```

## Network Configuration

### Subnet Requirements

- Cluster requires an **existing subnet** for node pools
- Subnet must be large enough for your node count
- Recommended: `/24` subnet (254 IPs) for small clusters
- Each node uses 1 IP + pods use additional IPs

### Service CIDR

- Must be **unique per cluster** to avoid conflicts
- Default: `10.101.0.0/16`
- For multiple clusters, increment: `10.102.0.0/16`, `10.103.0.0/16`, etc.
- Must not overlap with VNet CIDR or other clusters

### DNS Service IP

- Must be **within the Service CIDR** range
- Default: `10.101.0.10`
- Change if you change Service CIDR (e.g., `10.102.0.10`)

## Accessing Your Cluster

After the PR is merged and Crossplane provisions the cluster:

```bash
# Extract kubeconfig from Crossplane secret
kubectl get secret <cluster-name>-kubeconfig -n crossplane-system -o jsonpath='{.data.kubeconfig}' | base64 -d > ~/.kube/<cluster-name>.yaml

# Use the cluster
export KUBECONFIG=~/.kube/<cluster-name>.yaml
kubectl get nodes
kubectl get pods -A

# Or merge into your main kubeconfig
kubectl config view --flatten >> ~/.kube/config
```

## Monitoring Provisioning

```bash
# Check Crossplane claim status
kubectl get aksclusters.platform.chrishouse.io -n crossplane-system

# Describe for details
kubectl describe akscluster <cluster-name> -n crossplane-system

# Check Azure cluster status
az aks show --name <cluster-name> --resource-group <rg-name> --query provisioningState
```

## Deleting a Cluster

To delete the cluster and all its Azure resources:

1. Create a new branch:
   ```bash
   git checkout -b delete-cluster-<cluster-name>
   ```

2. Remove the claim directory:
   ```bash
   rm -rf infra/crossplane/claims/<cluster-name>
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "chore: delete ephemeral cluster <cluster-name>"
   git push origin delete-cluster-<cluster-name>
   ```

4. Create PR and merge after review

5. ArgoCD will sync and Crossplane will delete the Azure resources

## Quota Considerations

### Why Not East US?

The mgmt-hub cluster is in East US and approaching quota limits. This template defaults to **West US 2** to avoid quota issues.

Available regions (in order of recommendation):
1. **West US 2** - Primary alternative, low latency to East US
2. **Central US** - Good US alternative
3. **West Europe** - European teams
4. **North Europe** - European teams backup
5. **Australia East** - APAC teams
6. **Southeast Asia** - APAC teams backup

### Checking Quota

```bash
# Check AKS quota in a region
az vm list-usage --location westus2 --query "[?contains(name.value, 'standardBS')]" -o table
```

## Troubleshooting

### Cluster stuck in provisioning

```bash
# Check Crossplane provider logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-azure-containerservice

# Check claim conditions
kubectl get akscluster <cluster-name> -n crossplane-system -o yaml | grep -A 10 conditions
```

### Can't connect to cluster

```bash
# Verify kubeconfig secret exists
kubectl get secret <cluster-name>-kubeconfig -n crossplane-system

# Verify cluster exists in Azure
az aks show --name <cluster-name> --resource-group <rg-name>

# Get AKS credentials directly from Azure
az aks get-credentials --name <cluster-name> --resource-group <rg-name>
```

### Spot instance evicted

Spot VMs can be evicted with 30 seconds notice. To mitigate:
- Use Regular priority for critical dev work
- Implement pod disruption budgets
- Use persistent volumes for important data
- Monitor eviction events: `kubectl get events --field-selector reason=Evicted`

### Cluster provisioning failed

Common causes:
1. **Quota exceeded** - Try different region
2. **Subnet too small** - Need larger subnet
3. **Service CIDR conflict** - Use unique CIDR per cluster
4. **Invalid subnet ID** - Check subnet exists and is correct format

## Best Practices

1. **Use descriptive names** - `aks-team-alpha-dev`, not `aks-test-1`
2. **Set appropriate labels** - Team, environment, ephemeral
3. **Use Spot for dev** - Save 60-80% on costs
4. **Enable autoscaling** - Let cluster scale down when idle
5. **Clean up promptly** - Delete clusters when done testing
6. **Unique Service CIDRs** - Avoid conflicts with other clusters
7. **Document usage** - Note why cluster was created and when to delete

## Examples

### Basic dev cluster

- **Name**: `aks-team-alpha-dev`
- **VM Size**: Standard_B2s
- **Priority**: Spot
- **Nodes**: 1 initial, 1-3 autoscale
- **Region**: westus2

### Testing cluster with more resources

- **Name**: `aks-integration-test`
- **VM Size**: Standard_B2ms
- **Priority**: Spot
- **Nodes**: 2 initial, 2-5 autoscale
- **Region**: westus2

### Stable dev cluster (no evictions)

- **Name**: `aks-team-beta-stable`
- **VM Size**: Standard_B2s
- **Priority**: Regular
- **Nodes**: 1 initial, 1-3 autoscale
- **Region**: centralus

## Support

For issues with:
- **Template itself** - Contact platform-team
- **Crossplane provisioning** - Check Crossplane logs and Azure quota
- **Azure resources** - Check Azure Portal for errors
- **GitOps/ArgoCD** - Check ArgoCD application sync status
