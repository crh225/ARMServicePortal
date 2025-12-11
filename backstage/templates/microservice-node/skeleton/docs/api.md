# API Reference

## Endpoints
{% if values.ingress_enabled %}
Base URL: `https://${{ values.service_name }}.chrishouse.io`
{% else %}
Base URL: `http://localhost:${{ values.port }}`
{% endif %}

### GET /api/hello

Returns a hello world message.

**Response:**
```json
{
  "message": "Hello from ${{ values.service_name }}!",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /health

Health check endpoint for Kubernetes liveness probes.

**Response:**
```json
{
  "status": "healthy",
  "service": "${{ values.service_name }}",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /ready

Readiness check endpoint for Kubernetes readiness probes.

**Response:**
```json
{
  "status": "ready",
  "service": "${{ values.service_name }}",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | ${{ values.port }} |
| `NODE_ENV` | Environment mode | `development` |
{% if values.include_database %}| `DATABASE_URL` | PostgreSQL connection string | - |{% endif %}
{% if values.include_redis %}| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |{% endif %}
