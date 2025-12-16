# ${{ values.site_name }}

${{ values.description }}

## Getting Started

### Prerequisites
- Node.js ${{ values.node_version }}
- npm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:8000

### Building

```bash
# Build for production
npm run build

# Serve production build locally
npm run serve
```

## Deployment

This site is automatically deployed via GitOps:

1. Push to `main` branch
2. GitHub Actions builds the Gatsby site
3. Docker image is created and pushed to GHCR
4. ArgoCD syncs to AKS cluster
5. Available at: https://${{ values.domain }}

## Structure

```
.
├── src/              # Gatsby source files (add your blog here)
├── static/           # Static assets
├── helm/             # Kubernetes Helm chart
├── .github/          # CI/CD workflows
├── Dockerfile        # Multi-stage build
└── nginx.conf        # Nginx configuration
```

## Importing Your Existing Blog

If you have an existing Gatsby blog at `C:\Users\Chris\Development\blog`:

```bash
# Copy all src files
cp -r C:\Users\Chris\Development\blog/src/* ./src/
cp -r C:\Users\Chris\Development\blog/static/* ./static/

# Copy gatsby config if it exists
cp C:\Users\Chris\Development\blog/gatsby-*.js ./

# Merge package.json dependencies
# (manually merge the dependencies from your blog's package.json)

# Install and test
npm install
npm run dev
```

## Mario Game

If your blog includes a Mario game, make sure all assets are in the `static/mario/` directory. The nginx.conf is already configured to serve them correctly.
