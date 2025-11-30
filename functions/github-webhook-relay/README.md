# GitHub Webhook Relay Function

Azure Function that receives GitHub webhooks and publishes notification messages to RabbitMQ.

## Architecture

```
GitHub Webhooks → Azure Function → RabbitMQ → Backend API → WebSocket → Frontend UI
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RABBITMQ_URL` | AMQP connection URL | Required |
| `RABBITMQ_EXCHANGE` | Exchange name for messages | `github-webhooks` |
| `RABBITMQ_QUEUE` | Queue name for notifications | `notifications` |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhooks | Optional |

## Endpoints

- `POST /api/webhooks/github` - Receives GitHub webhooks
- `GET /api/health` - Health check endpoint

## Message Format

Messages published to RabbitMQ follow this schema:

```json
{
  "type": "success|error|info",
  "title": "Workflow Completed: terraform-plan-azure-storage-basic-dev",
  "message": "PR #123 - Add storage account",
  "prNumber": 123,
  "jobId": "12345678",
  "environment": "dev",
  "blueprint": "azure-storage-basic",
  "url": "https://github.com/...",
  "action": "completed",
  "status": "completed",
  "conclusion": "success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `local.settings.json` and update values

3. Run the function:
   ```bash
   npm start
   ```

## Deployment

The function is deployed to the Azure Function App created by the `azure-function` blueprint.
Configure the following app settings in Azure:

- `RABBITMQ_URL` - RabbitMQ connection string (from Kubernetes secret)
- `GITHUB_WEBHOOK_SECRET` - GitHub webhook secret
