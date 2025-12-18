# Infrastructure

## Azure Resources

All infrastructure is managed via Crossplane claims in the GitOps repository.

### Resource Group

| Property | Value |
|----------|-------|
| Name | `${{ values.resourceGroupName }}` |
| Location | ${{ values.location }} |
| Subscription | `f989de0f-8697-4a05-8c34-b82c941767c0` |

[View in Azure Portal](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }})

{%- if values.includeStorage %}

### Storage Account

| Property | Value |
|----------|-------|
| Name | `${{ values.storageAccountName }}` |
| Tier | Standard |
| Replication | LRS |
| Kind | StorageV2 |
| TLS Version | 1.2 |

**Connection Secret**: `${{ values.storageAccountName }}-conn` (in namespace `${{ values.namespace }}`)

[View in Azure Portal](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }}/providers/Microsoft.Storage/storageAccounts/${{ values.storageAccountName }})
{%- endif %}

{%- if values.includeKeyVault %}

### Key Vault

| Property | Value |
|----------|-------|
| Name | `${{ values.keyVaultName }}` |
| SKU | Standard |
| Soft Delete | 7 days |
| Purge Protection | Disabled |

[View in Azure Portal](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }}/providers/Microsoft.KeyVault/vaults/${{ values.keyVaultName }})

#### Usage

To add secrets from your application:

```bash
az keyvault secret set \
  --vault-name ${{ values.keyVaultName }} \
  --name "my-secret" \
  --value "secret-value"
```
{%- endif %}

{%- if values.includeAppConfig %}

### App Configuration

| Property | Value |
|----------|-------|
| Name | `${{ values.appConfigName }}` |
| SKU | Free |

[View in Azure Portal](https://portal.azure.com/#@/resource/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/${{ values.resourceGroupName }}/providers/Microsoft.AppConfiguration/configurationStores/${{ values.appConfigName }})

#### Usage

To add configuration values:

```bash
az appconfig kv set \
  --name ${{ values.appConfigName }} \
  --key "MyApp:Setting" \
  --value "value"
```

To add feature flags:

```bash
az appconfig feature set \
  --name ${{ values.appConfigName }} \
  --feature "my-feature" \
  --yes
```
{%- endif %}

## Kubernetes Resources

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ${{ values.namespace }}
```

### Deployment

The application is deployed via Helm chart located in the `helm/` directory.

| Resource | Name |
|----------|------|
| Deployment | `${{ values.appName }}` |
| Service | `${{ values.appName }}` |
| Ingress | `${{ values.appName }}` |

### Ingress

| Property | Value |
|----------|-------|
| Host | `${{ values.domain }}` |
| TLS | Enabled (cert-manager) |
| Class | nginx |

## Crossplane Claims

Claims are located in the GitOps repo at:
```
infra/team-stacks/${{ values.teamName }}-${{ values.environment }}/crossplane/claims.yaml
```

To view claim status:

```bash
kubectl get managed -n ${{ values.namespace }}
```
