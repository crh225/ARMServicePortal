# Plan: Migrate Frontend from Azure Front Door to Container Apps

## Goal
Replace Azure Front Door ($35/mo) with Container Apps for frontend hosting, saving ~$30/mo.

## Current Architecture
```
portal.chrishouse.io
        │
        ▼
   Cloudflare (DNS/CDN)
        │
        ▼
  Azure Front Door ($35/mo)  ◄── DELETE THIS
        │
        ▼
  Storage Account (static site)
  armportalfec4ji.z20.web.core.windows.net
```

## Target Architecture
```
portal.chrishouse.io
        │
        ▼
   Cloudflare (DNS/CDN)
        │
        ▼
  Container Apps (nginx)  ◄── NEW (~$5/mo)
  armportal-frontend-dev
```

---

## Implementation Steps

### Phase 1: Create Frontend Docker Image

**1.1 Create Dockerfile for frontend**
- File: `portal/frontend/Dockerfile`
```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**1.2 Create nginx.conf for SPA routing**
- File: `portal/frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

---

### Phase 2: Add Frontend Container App to Terraform

**2.1 Update `backend-containerapps.tf` (rename to `containerapps.tf`)**

Add frontend container app resource:
```hcl
resource "azurerm_container_app" "frontend" {
  name                         = "armportal-frontend-dev"
  resource_group_name          = module.azure-rg-basic_b0802fb2.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.backend.id
  revision_mode                = "Single"

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "frontend-infrastructure"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }

  registry {
    server               = azurerm_container_registry.backend_acr.login_server
    username             = azurerm_container_registry.backend_acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.backend_acr.admin_password
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "armportal-frontend"
      image  = "${azurerm_container_registry.backend_acr.login_server}/armportal-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      liveness_probe {
        transport        = "HTTP"
        path             = "/health"
        port             = 80
        interval_seconds = 30
      }

      readiness_probe {
        transport        = "HTTP"
        path             = "/health"
        port             = 80
        interval_seconds = 10
      }
    }
  }
}

output "frontend_app_url" {
  value = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}
```

---

### Phase 3: Create GitHub Actions Workflow

**3.1 Update `.github/workflows/frontend-dev.yml`**

Replace storage upload with Docker build + Container Apps deploy:
```yaml
name: "Frontend: Build & Deploy (Container Apps)"

on:
  push:
    branches: [ main ]
    paths:
      - "portal/frontend/**"
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    env:
      ACR_NAME: armportalacre4k9
      RESOURCE_GROUP: rg-testpr3-dev-rg
      CONTAINER_APP_NAME: armportal-frontend-dev
      VITE_API_URL: https://armportal-api-dev.kindisland-0c7a7c9a.eastus2.azurecontainerapps.io

    steps:
      - uses: actions/checkout@v4

      - name: Azure login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get ACR login server
        id: acr
        run: |
          LOGIN_SERVER=$(az acr show -n $ACR_NAME --query loginServer -o tsv)
          echo "login_server=$LOGIN_SERVER" >> $GITHUB_OUTPUT

      - name: Build and push image
        run: |
          LOGIN_SERVER="${{ steps.acr.outputs.login_server }}"
          IMAGE="$LOGIN_SERVER/armportal-frontend:${{ github.sha }}"
          LATEST="$LOGIN_SERVER/armportal-frontend:latest"

          az acr login --name $ACR_NAME

          docker build \
            --build-arg VITE_API_URL=$VITE_API_URL \
            -t "$IMAGE" \
            -t "$LATEST" \
            -f portal/frontend/Dockerfile \
            portal/frontend

          docker push "$IMAGE"
          docker push "$LATEST"

      - name: Update Container App
        run: |
          LOGIN_SERVER="${{ steps.acr.outputs.login_server }}"
          IMAGE="$LOGIN_SERVER/armportal-frontend:${{ github.sha }}"

          az containerapp update \
            --name $CONTAINER_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --image "$IMAGE"

      - name: Verify deployment
        run: |
          sleep 10
          FQDN=$(az containerapp show \
            --name $CONTAINER_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --query "properties.configuration.ingress.fqdn" -o tsv)

          curl -sf "https://$FQDN/health" && echo "Health check passed!"
```

---

### Phase 4: Update Cloudflare DNS

**4.1 Update DNS record for portal.chrishouse.io**
- Current: Points to Azure Front Door endpoint
- New: Point to Container Apps FQDN (via CNAME or proxied)

```
portal.chrishouse.io → armportal-frontend-dev.<env-id>.eastus2.azurecontainerapps.io
```

---

### Phase 5: Cleanup Old Resources

**5.1 Delete Terraform files**
```bash
git rm infra/environments/dev/azure-frontdoor_771fc1c8.tf
git rm infra/environments/dev/frontend-storage.tf
```

**5.2 Delete Azure resources**
```bash
# Front Door
az cdn profile delete -n afd-portal-dev-n5cj -g test3-dev-rg

# Storage account (optional - can keep for backup)
az storage account delete -n armportalfec4ji -g rg-testpr3-dev-rg
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `portal/frontend/Dockerfile` | CREATE |
| `portal/frontend/nginx.conf` | CREATE |
| `infra/environments/dev/backend-containerapps.tf` | MODIFY (add frontend container app) |
| `.github/workflows/frontend-dev.yml` | MODIFY (Docker build instead of storage upload) |
| `infra/environments/dev/azure-frontdoor_771fc1c8.tf` | DELETE |
| `infra/environments/dev/frontend-storage.tf` | DELETE (or keep for backup) |

---

## Cost Comparison

| Component | Before | After |
|-----------|--------|-------|
| Azure Front Door | $35/mo | $0 |
| Storage Account (static) | $1/mo | $0 (delete) or $1 (keep) |
| Container Apps (frontend) | $0 | ~$5/mo |
| **Total** | **$36/mo** | **~$5/mo** |

**Savings: ~$30/mo**

---

## Rollback Plan

If issues occur:
1. Re-enable storage account static website
2. Update Cloudflare DNS back to Front Door
3. Restore Terraform files from git

---

## Testing Checklist

- [ ] Frontend Docker image builds successfully
- [ ] Container App deploys and passes health check
- [ ] SPA routing works (deep links like /blueprints/123)
- [ ] Static assets load with proper caching
- [ ] API calls work (CORS configured correctly)
- [ ] Cloudflare SSL works with Container Apps
- [ ] GitHub Actions workflow completes successfully
