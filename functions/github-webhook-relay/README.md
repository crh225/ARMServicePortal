# GitHub Webhook Relay

Receives GitHub webhooks and publishes notification messages to RabbitMQ for real-time UI updates. Runs as a container in AKS.

## Architecture

```
GitHub Webhooks → Webhook Relay (AKS) → RabbitMQ → Backend API → SSE → Frontend UI
                  (transform &           (message    (consume &   (real-time
                   publish)               queue)      broadcast)   updates)
```

### Flow

1. **GitHub** sends webhook events to the webhook relay
2. **Webhook Relay** verifies the signature, transforms the payload to a notification, and publishes to RabbitMQ
3. **RabbitMQ** queues messages (internal K8s service)
4. **Backend API** consumes messages from RabbitMQ and stores in Redis
5. **SSE** broadcasts notifications to connected frontend clients
6. **Frontend** displays real-time toast notifications

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | HTTP port (default: 3000) | No |
| `RABBITMQ_URL` | AMQP connection URL (e.g., `amqp://user:pass@host:5672`) | Yes |
| `GH_WEBHOOK_SECRET` | Secret for verifying GitHub webhook signatures | Recommended |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/github` | POST | Receives GitHub webhooks |
| `/api/health` | GET | Health check (includes RabbitMQ connectivity) |
| `/healthz` | GET | Liveness probe |
| `/readyz` | GET | Readiness probe |

## Supported GitHub Events

The relay transforms these GitHub events into notifications:

- `workflow_run` - CI/CD workflow completed/started
- `workflow_job` - Individual job in a workflow
- `check_run` - Check suite results
- `pull_request` - PR opened/closed/merged
- `push` - Code pushed to a branch
- `deployment` / `deployment_status` - Deployment events
- All other events are handled generically

## Message Format

Messages published to RabbitMQ:

```json
{
  "id": "uuid-v4",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "type": "workflow_run",
  "title": "Workflow completed: Build and Test",
  "message": "feat: add new feature - success",
  "prNumber": 123,
  "repository": "owner/repo",
  "url": "https://github.com/owner/repo/actions/runs/123",
  "deliveryId": "github-delivery-id",
  "read": false
}
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start RabbitMQ locally:
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management
   ```

3. Set environment variables:
   ```bash
   export RABBITMQ_URL="amqp://guest:guest@localhost:5672"
   export GH_WEBHOOK_SECRET="your-secret-here"
   ```

4. Run the server:
   ```bash
   npm start
   ```

5. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/github \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: workflow_run" \
     -d '{"action":"completed","workflow_run":{"name":"Test","conclusion":"success"}}'
   ```

## Deployment (AKS)

### Automated (GitHub Actions)

Push changes to `functions/github-webhook-relay/**` to trigger the deployment workflow.

The workflow:
1. Builds the Docker image
2. Pushes to Azure Container Registry
3. Fetches secrets from Azure Key Vault
4. Creates/updates K8s secrets
5. Deploys to AKS

### Production URL

- **Webhook Endpoint**: `https://webhooks.chrishouse.io/api/webhooks/github`
- **Health Check**: `https://webhooks.chrishouse.io/api/health`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | Azure service principal client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

### Required Key Vault Secrets

| Secret Name | Description |
|-------------|-------------|
| `rabbitmq-url` | AMQP URL for internal RabbitMQ service |
| `gh-webhook-secret` | Webhook secret configured in GitHub |

### Configure GitHub Webhook

1. Go to your GitHub repository > Settings > Webhooks > Add webhook
2. **Payload URL**: `https://webhooks.chrishouse.io/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Same value as `gh-webhook-secret` in Key Vault
5. **Events**: Select events you want to receive (or "Send me everything")

## Kubernetes Resources

Located in `infra/crossplane/applications/webhook-relay/`:

- `deployment.yaml` - Deployment and Service
- `ingress.yaml` - Ingress with TLS
- `kustomization.yaml` - Kustomize config

## Troubleshooting

### Webhook relay can't connect to RabbitMQ

1. Verify the RABBITMQ_URL uses the internal K8s DNS name
2. Check RabbitMQ pod is running:
   ```bash
   kubectl get pods -n rabbit-xp1-dev
   ```
3. Check webhook-relay logs:
   ```bash
   kubectl logs -n webhook-relay -l app=webhook-relay
   ```

### Webhook signature verification failed

1. Verify the `GH_WEBHOOK_SECRET` matches what's configured in GitHub
2. Check the webhook delivery in GitHub > Settings > Webhooks > Recent Deliveries
3. Check pod logs for error details

### Messages not appearing in UI

1. Check RabbitMQ management UI for message queue
2. Verify backend is consuming from the correct queue
3. Check browser console for SSE connection status
