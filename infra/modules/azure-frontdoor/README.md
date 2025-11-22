# Azure Front Door Module

This Terraform module creates an Azure Front Door (Standard or Premium) to serve your static website with custom domain support, HTTPS, and CDN capabilities.

## Features

- Azure Front Door Profile (Standard or Premium SKU)
- Origin configuration for static websites (or any HTTPS endpoint)
- Custom domain support with automatic HTTPS/TLS
- HTTPS redirect and forwarding
- Health probes and load balancing
- ARM Portal tagging

## Usage

### Step 1: Deploy via ARM Portal

1. Go to your ARM Portal Blueprints page
2. Select "Azure Front Door"
3. Fill in the form:
   - **Project Name**: e.g., `armportal`
   - **Environment**: `prod`
   - **Resource Group Name**: Use existing RG (e.g., `rg-armportal-prod`)
   - **Origin Hostname**: Your storage static website endpoint (e.g., `armportalfrontend1a2b.z20.web.core.windows.net`)
   - **Custom Domain** (optional): e.g., `portal.chrishouse.io`
   - **SKU**: `Standard_AzureFrontDoor` (or Premium for advanced features)

4. Submit the blueprint request

### Step 2: Configure DNS in Cloudflare

After the Front Door is deployed, you'll get outputs from Terraform:

- `frontdoor_endpoint_hostname`: e.g., `ep-armportal-prod-abc123.azurefd.net`
- `custom_domain_validation_token`: A unique token for domain validation
- `custom_domain_name`: The custom domain you specified

#### Add DNS Records:

1. **Add TXT record for domain validation**:
   - Type: `TXT`
   - Name: `_dnsauth.portal` (or `_dnsauth` for root domain)
   - Value: The validation token from the output
   - Proxy: **DNS Only** (disable Cloudflare proxy)

2. **Add CNAME to route traffic**:
   - Type: `CNAME`
   - Name: `portal`
   - Target: The Front Door endpoint hostname (e.g., `ep-armportal-prod-abc123.azurefd.net`)
   - Proxy: **DNS Only** (disable Cloudflare proxy)

### Step 3: Wait for DNS Validation

- Azure will automatically validate your domain (may take 5-15 minutes)
- Check validation status in Azure Portal: Front Door > Custom domains
- Wait for the domain status to show "Approved" or "Validated"

### Step 4: Associate Custom Domain with Route

After DNS validation is complete, you need to manually associate the custom domain:

**Option A: Azure Portal (Recommended)**
1. Go to Azure Portal > Front Door profile
2. Navigate to "Custom domains"
3. Click on your custom domain (e.g., `portal.chrishouse.io`)
4. Click "Associate" and select your route (e.g., `route-portal-afd-dev`)
5. Click "Save"

**Option B: Terraform (Advanced)**
1. Uncomment the `azurerm_cdn_frontdoor_custom_domain_association` resource in `main.tf`
2. Run `terraform apply` again
3. This will associate the custom domain with the route

### Step 5: Wait for HTTPS Provisioning

- Azure will provision a managed TLS certificate (may take up to 60 minutes)
- Once complete, your site will be available at `https://portal.chrishouse.io`

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project_name | Short name of the project | string | - | yes |
| environment | Environment (e.g., dev, prod) | string | - | yes |
| resource_group_name | Existing resource group | string | - | yes |
| origin_hostname | Origin hostname (e.g., storage website endpoint) | string | - | yes |
| custom_domain | Custom domain name | string | null | no |
| sku_name | Front Door SKU | string | `Standard_AzureFrontDoor` | no |
| tags | Additional tags | map(string) | {} | no |
| request_id | ARM Portal request ID | string | null | no |
| owner | ARM Portal owner | string | `crh225` | no |

## Outputs

| Name | Description |
|------|-------------|
| frontdoor_endpoint_hostname | Front Door endpoint hostname (use as CNAME target) |
| frontdoor_profile_id | Front Door profile ID |
| custom_domain_validation_token | Validation token for TXT record |
| custom_domain_name | Custom domain name |

## Example: Finding Your Origin Hostname

If you have a storage account with static website enabled:

```bash
# Get your storage account static website endpoint
az storage account show \
  --name <storage-account-name> \
  --resource-group <resource-group> \
  --query "primaryEndpoints.web" -o tsv

# Example output: https://armportalfrontend1a2b.z20.web.core.windows.net/
# Use: armportalfrontend1a2b.z20.web.core.windows.net (remove https:// and trailing /)
```

Or check the Azure Portal:
1. Go to your Storage Account
2. Navigate to "Static website" under Data management
3. Copy the "Primary endpoint" hostname (without `https://` and trailing `/`)

## Pricing

Azure Front Door Standard: ~$35-40/month base fee + data transfer

- Standard: $35/month + $0.01/GB outbound
- Premium: $330/month + $0.015/GB outbound (includes WAF, DDoS protection, etc.)

## Notes

- HTTPS is automatically enabled with Azure-managed certificates
- DNS validation is required for custom domains
- Cloudflare proxy must be disabled (DNS only) for Azure validation to work
- After validation, you can optionally re-enable Cloudflare proxy if desired
