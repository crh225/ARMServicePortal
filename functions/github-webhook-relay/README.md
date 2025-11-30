# GitHub Webhook Relay Function

Azure Function that receives GitHub webhooks and publishes notification messages to RabbitMQ for real-time UI updates.

## Architecture

```
GitHub Webhooks → Azure Function → RabbitMQ → Backend API → SSE → Frontend UI
                  (transform &      (message    (consume &   (real-time
                   publish)          queue)      broadcast)   updates)
```

### Flow

1. **GitHub** sends webhook events to the Azure Function
2. **Azure Function** verifies the signature, transforms the payload to a notification, and publishes to RabbitMQ
3. **RabbitMQ** queues messages (exposed via Azure Load Balancer from AKS)
4. **Backend API** consumes messages from RabbitMQ and stores in Redis
5. **SSE** broadcasts notifications to connected frontend clients
6. **Frontend** displays real-time toast notifications

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RABBITMQ_URL` | AMQP connection URL (e.g., `amqp://user:pass@host:5672`) | Yes |
| `GH_WEBHOOK_SECRET` | Secret for verifying GitHub webhook signatures | Recommended |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/github` | POST | Receives GitHub webhooks |
| `/api/health` | GET | Health check (includes RabbitMQ connectivity) |

## Supported GitHub Events

The function transforms these GitHub events into notifications:

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

2. Start RabbitMQ locally (or use the dev instance):
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management
   ```

3. Update `local.settings.json`:
   ```json
   {
     "Values": {
       "RABBITMQ_URL": "amqp://guest:guest@localhost:5672",
       "GH_WEBHOOK_SECRET": "your-secret-here"
     }
   }
   ```

4. Run the function:
   ```bash
   npm start
   ```

5. Test with curl:
   ```bash
   curl -X POST http://localhost:7071/api/webhooks/github \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: workflow_run" \
     -d '{"action":"completed","workflow_run":{"name":"Test","conclusion":"success"}}'
   ```

## Deployment

### Automated (GitHub Actions)

Push changes to `functions/github-webhook-relay/**` to trigger the deployment workflow.

The workflow:
1. Builds the function
2. Fetches secrets from Azure Key Vault
3. Deploys to Azure Functions
4. Configures app settings

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | Azure service principal client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_KEYVAULT_NAME` | Key Vault name (e.g., `akvnotintf1`) |
| `AZURE_RESOURCE_GROUP` | Resource group containing the Function App |

### Required Key Vault Secrets

| Secret Name | Description |
|-------------|-------------|
| `rabbitmq-url` | AMQP URL: `amqp://admin:password@rabbit-xp1-amqp.eastus.cloudapp.azure.com:5672` |
| `gh-webhook-secret` | Webhook secret configured in GitHub |

### Configure GitHub Webhook

1. Go to your GitHub repository > Settings > Webhooks > Add webhook
2. **Payload URL**: `https://<function-app>.azurewebsites.net/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Same value as `gh-webhook-secret` in Key Vault
5. **Events**: Select events you want to receive (or "Send me everything")

## RabbitMQ Access

RabbitMQ is deployed in AKS via Crossplane and exposed externally:

- **AMQP**: `amqp://rabbit-xp1-amqp.eastus.cloudapp.azure.com:5672`
- **Management UI**: `https://rabbit-xp1.pr.chrishouse.io`
- **Namespace**: `rabbit-xp1-dev`

Credentials are in the `rabbit-xp1-dev-rabbitmq-credentials` secret.

## Troubleshooting

### Function can't connect to RabbitMQ

1. Verify the RABBITMQ_URL is correct
2. Check if the RabbitMQ LoadBalancer service has an external IP:
   ```bash
   kubectl get svc -n rabbit-xp1-dev | grep amqp
   ```
3. Test connectivity from your local machine:
   ```bash
   nc -zv rabbit-xp1-amqp.eastus.cloudapp.azure.com 5672
   ```

### Webhook signature verification failed

1. Verify the `GH_WEBHOOK_SECRET` matches what's configured in GitHub
2. Check the webhook delivery in GitHub > Settings > Webhooks > Recent Deliveries
3. Look at the Function logs in Azure Portal

### Messages not appearing in UI

1. Check RabbitMQ management UI for message queue
2. Verify backend is consuming from the correct queue
3. Check browser console for SSE connection status
