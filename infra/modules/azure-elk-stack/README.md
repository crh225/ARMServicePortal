# Azure ELK Stack Module

This Terraform module deploys a complete ELK (Elasticsearch, Logstash, Kibana) stack on Azure using Container Instances for centralized logging from Node.js applications.

## Features

- **Elasticsearch**: Full-text search and analytics engine
- **Logstash**: Log ingestion and processing pipeline
- **Kibana**: Visualization and management dashboard
- **Persistent Storage**: Azure File Share for Elasticsearch data persistence
- **Multiple Input Methods**: Beats (port 5044), TCP (port 5000), HTTP (port 8080)
- **Automatic Indexing**: Daily indices with pattern `nodejs-logs-YYYY.MM.dd`

## Architecture

The module creates:
- Azure Storage Account with File Share for persistent Elasticsearch data
- Azure Container Instance group with three containers:
  - Elasticsearch (9200, 9300)
  - Logstash (5044, 5000, 8080)
  - Kibana (5601)

## Usage

### Basic Deployment

```hcl
module "elk_stack" {
  source = "../../modules/azure-elk-stack"

  project_name        = "myapp"
  environment         = "dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  tags = {
    ManagedBy = "Terraform"
    Team      = "DevOps"
  }
}
```

### Custom Configuration

```hcl
module "elk_stack" {
  source = "../../modules/azure-elk-stack"

  project_name        = "myapp"
  environment         = "prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  # Custom ELK version
  elk_version = "8.12.0"

  # Increase resources for production
  elasticsearch_cpu    = 2.0
  elasticsearch_memory = 4.0
  elasticsearch_heap   = "2g"

  logstash_cpu    = 1.0
  logstash_memory = 2.0

  # Storage configuration
  storage_quota_gb = 100

  # Security
  enable_https = false  # Set to true in production with proper certificate setup

  tags = {
    ManagedBy   = "Terraform"
    Environment = "production"
  }
}
```

## Node.js Integration

### Option 1: Winston with Logstash Transport

Install the package:
```bash
npm install winston winston-logstash
```

Configure Winston:
```javascript
import winston from 'winston';
import LogstashTransport from 'winston-logstash/lib/winston-logstash-latest.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    // Logstash output
    new LogstashTransport({
      port: 5000,
      host: process.env.LOGSTASH_HOST || 'your-elk-stack.eastus.azurecontainer.io',
      node_name: process.env.NODE_NAME || 'api-server',
      max_connect_retries: -1
    })
  ]
});

export default logger;
```

### Option 2: Pino with TCP Transport

Install the package:
```bash
npm install pino pino-socket
```

Configure Pino:
```javascript
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: { destination: 1 },
        level: 'info'
      },
      {
        target: 'pino-socket',
        options: {
          address: process.env.LOGSTASH_HOST || 'your-elk-stack.eastus.azurecontainer.io',
          port: 5000,
          mode: 'tcp'
        },
        level: 'info'
      }
    ]
  }
});

export default logger;
```

### Option 3: HTTP Endpoint

For simpler integration, send logs via HTTP:

```javascript
async function sendLog(level, message, metadata = {}) {
  try {
    await fetch(`http://${process.env.LOGSTASH_HOST}:8080`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        service: 'api-server',
        ...metadata
      })
    });
  } catch (error) {
    console.error('Failed to send log to ELK:', error);
  }
}
```

## Environment Variables

Set these environment variables in your Node.js application:

```bash
# From Terraform outputs
LOGSTASH_HOST=your-elk-stack.eastus.azurecontainer.io
LOGSTASH_PORT=5000
KIBANA_URL=http://your-elk-stack.eastus.azurecontainer.io:5601
```

To get these values after deployment:
```bash
terraform output logstash_host
terraform output logstash_port
terraform output kibana_url
```

## Accessing Kibana

After deployment, access the Kibana dashboard at the URL from the output:
```bash
terraform output kibana_url
```

### Initial Setup in Kibana

1. Open the Kibana URL in your browser
2. Go to **Management** → **Stack Management** → **Index Patterns**
3. Create an index pattern: `nodejs-logs-*`
4. Select `@timestamp` as the time field
5. Go to **Discover** to view your logs

### Useful Queries

Filter by log level:
```
level: "error"
```

Search for specific text:
```
message: "database connection"
```

Filter by service:
```
service: "api-server" AND level: "error"
```

## Outputs

| Name | Description |
|------|-------------|
| `kibana_url` | URL to access Kibana dashboard |
| `logstash_host` | Logstash host for Node.js applications |
| `logstash_port` | Logstash port for Node.js applications |
| `elasticsearch_url` | Elasticsearch URL (sensitive) |
| `container_group_id` | ID of the container group |
| `storage_account_name` | Name of the storage account for ELK data |

## Important Notes

### Security Considerations

- **This is a development/staging setup**. For production:
  - Enable HTTPS with proper certificates
  - Add authentication to Elasticsearch and Kibana
  - Use Azure Private Endpoints
  - Implement network security groups
  - Enable Azure Monitor and diagnostics

### Storage and Costs

- Elasticsearch data is persisted in Azure File Share
- Container Instances run 24/7 - monitor costs
- Consider stopping the container group when not in use:
  ```bash
  az container stop --resource-group <rg-name> --name <container-name>
  ```

### Performance Tuning

For heavy logging workloads, adjust:
- `elasticsearch_heap`: Elasticsearch JVM heap size
- `logstash_heap`: Logstash JVM heap size
- CPU and memory allocations for each container

### Data Retention

Elasticsearch will accumulate data over time. Implement Index Lifecycle Management (ILM):
1. In Kibana, go to **Management** → **Stack Management** → **Index Lifecycle Policies**
2. Create a policy to delete old indices (e.g., after 30 days)
3. Apply the policy to the `nodejs-logs-*` index template

## Troubleshooting

### Logs not appearing in Kibana

1. Check if the container group is running:
   ```bash
   az container show --resource-group <rg> --name <name> --query "instanceView.state"
   ```

2. View container logs:
   ```bash
   az container logs --resource-group <rg> --name <name> --container-name logstash
   ```

3. Verify your Node.js app can reach Logstash:
   ```bash
   telnet <logstash-host> 5000
   ```

### Elasticsearch health issues

Check Elasticsearch logs:
```bash
az container logs --resource-group <rg> --name <name> --container-name elasticsearch
```

Common issues:
- Insufficient memory (increase `elasticsearch_memory`)
- Storage issues (check Azure File Share quota)

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| azurerm | >= 3.0 |

## License

This module is provided as-is for use with the ARM Service Portal project.
