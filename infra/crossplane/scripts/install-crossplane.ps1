# Crossplane Installation Script for ARM Service Portal
# PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Installing Crossplane on AKS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: kubectl not found. Please install kubectl first." -ForegroundColor Red
    Write-Host "Install via: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: helm not found. Please install helm first." -ForegroundColor Red
    Write-Host "Install via: choco install kubernetes-helm" -ForegroundColor Yellow
    exit 1
}

# Verify kubectl context
Write-Host ""
Write-Host "Current kubectl context:" -ForegroundColor Yellow
kubectl config current-context

Write-Host ""
$confirmation = Read-Host "Is this the correct AKS cluster? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Please switch to the correct kubectl context and try again." -ForegroundColor Yellow
    Write-Host "Hint: az aks get-credentials --resource-group rg-armportal-aks-crossplane-dev --name aks-armportal-crossplane-dev" -ForegroundColor Cyan
    exit 1
}

# Create namespace
Write-Host ""
Write-Host "Creating crossplane-system namespace..." -ForegroundColor Yellow
kubectl create namespace crossplane-system --dry-run=client -o yaml | kubectl apply -f -

# Add Crossplane Helm repository
Write-Host ""
Write-Host "Adding Crossplane Helm repository..." -ForegroundColor Yellow
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# Install Crossplane
Write-Host ""
Write-Host "Installing Crossplane..." -ForegroundColor Yellow
helm upgrade --install crossplane `
  crossplane-stable/crossplane `
  --namespace crossplane-system `
  --create-namespace `
  --wait

Write-Host "Waiting for Crossplane to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/crossplane -n crossplane-system

# Verify installation
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Crossplane Installation Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Verifying installation..." -ForegroundColor Yellow
kubectl get pods -n crossplane-system

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install Azure Provider: kubectl apply -f providers\azure-provider.yaml" -ForegroundColor White
Write-Host "2. Configure Provider: kubectl apply -f providers\azure-provider-config.yaml" -ForegroundColor White
Write-Host "3. Deploy Compositions: kubectl apply -f compositions\" -ForegroundColor White
Write-Host ""
