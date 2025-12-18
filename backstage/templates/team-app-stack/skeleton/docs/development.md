# Development

## Prerequisites

- Node.js ${{ values.node_version }}.x
- npm 9+
- Docker (for local container builds)

## Local Development

### Setup

```bash
# Clone the repository
git clone https://github.com/crh225/team-${{ values.teamName }}-${{ values.appName }}.git
cd team-${{ values.teamName }}-${{ values.appName }}

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:${{ values.port }}](http://localhost:${{ values.port }})

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run linter |

## Project Structure

```
team-${{ values.teamName }}-${{ values.appName }}/
├── src/                    # Application source code
│   └── index.js           # Main entry point
├── helm/                   # Kubernetes Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── docs/                   # Documentation (TechDocs)
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD pipeline
├── Dockerfile             # Container build
├── package.json
├── mkdocs.yml             # TechDocs config
└── catalog-info.yaml      # Backstage catalog
```

## Environment Variables

{%- if values.includeKeyVault or values.includeAppConfig or values.includeStorage %}

Your application can access the following Azure resources:

| Variable | Description | Source |
|----------|-------------|--------|
{%- if values.includeStorage %}
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account connection | K8s Secret |
{%- endif %}
{%- if values.includeKeyVault %}
| `AZURE_KEYVAULT_URL` | Key Vault URL | ConfigMap |
{%- endif %}
{%- if values.includeAppConfig %}
| `AZURE_APPCONFIG_ENDPOINT` | App Configuration endpoint | ConfigMap |
{%- endif %}
{%- else %}

No Azure resources were provisioned with this stack. Add environment variables as needed in `helm/values.yaml`.
{%- endif %}

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Code Style

This project uses ESLint for code linting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

## Building Docker Image Locally

```bash
# Build the image
docker build -t team-${{ values.teamName }}-${{ values.appName }}:local .

# Run locally
docker run -p ${{ values.port }}:${{ values.port }} team-${{ values.teamName }}-${{ values.appName }}:local
```

## Debugging

### Health Check

The application exposes a health endpoint at `/health`:

```bash
curl http://localhost:${{ values.port }}/health
```

### Logs

View application logs in Kubernetes:

```bash
kubectl logs -n ${{ values.namespace }} -l app=${{ values.appName }} -f
```
