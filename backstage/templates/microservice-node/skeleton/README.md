# ${{ values.service_name }}

${{ values.description }}
{% if values.ingress_enabled %}
## Live URL

🌐 **https://${{ values.service_name }}.chrishouse.io**

| Endpoint | URL |
|----------|-----|
| Health | https://${{ values.service_name }}.chrishouse.io/health |
| Ready | https://${{ values.service_name }}.chrishouse.io/ready |
| API | https://${{ values.service_name }}.chrishouse.io/api/hello |
{% endif %}
## Getting Started

### Prerequisites

- Node.js ${{ values.node_version }}+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The service will start on port ${{ values.port }}.

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/api/hello` | GET | Example endpoint |

## Docker

Build the image:

```bash
docker build -t ${{ values.service_name }} .
```

Run the container:

```bash
docker run -p ${{ values.port }}:${{ values.port }} ${{ values.service_name }}
```

## Kubernetes Deployment

Deploy using Helm:

```bash
helm install ${{ values.service_name }} ./helm
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | ${{ values.port }} |
{% if values.include_database %}| `DATABASE_URL` | PostgreSQL connection string | - |{% endif %}
{% if values.include_redis %}| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |{% endif %}

## Owner

${{ values.owner }}
