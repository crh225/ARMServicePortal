# Istio Service Mesh Installation Script for ARM Service Portal
# PowerShell version

param(
    [switch]$SkipDownload,
    [switch]$DryRun,
    [switch]$Force,
    [string]$IstioVersion = "1.24.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))
$IstioConfigDir = Join-Path $RepoRoot "infra\crossplane\cluster-setup\istio"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Installing Istio Service Mesh on AKS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Istio Version: $IstioVersion" -ForegroundColor White
Write-Host "Config Dir: $IstioConfigDir" -ForegroundColor White
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check for istioctl
$istioctlPath = $null
if (Get-Command istioctl -ErrorAction SilentlyContinue) {
    $istioctlPath = (Get-Command istioctl).Source
    Write-Host "Found istioctl: $istioctlPath" -ForegroundColor Green
} else {
    Write-Host "istioctl not found in PATH" -ForegroundColor Yellow

    # Check common locations
    $commonPaths = @(
        "$env:USERPROFILE\istio-$IstioVersion\bin\istioctl.exe",
        "$env:USERPROFILE\.istioctl\bin\istioctl.exe",
        "C:\istio\bin\istioctl.exe"
    )

    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $istioctlPath = $path
            Write-Host "Found istioctl at: $istioctlPath" -ForegroundColor Green
            break
        }
    }

    if (-not $istioctlPath -and -not $SkipDownload) {
        Write-Host ""
        Write-Host "Downloading Istio $IstioVersion..." -ForegroundColor Yellow

        $downloadDir = "$env:USERPROFILE\istio-$IstioVersion"
        $zipFile = "$env:TEMP\istio-$IstioVersion-win.zip"
        $downloadUrl = "https://github.com/istio/istio/releases/download/$IstioVersion/istio-$IstioVersion-win.zip"

        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
            Expand-Archive -Path $zipFile -DestinationPath $env:USERPROFILE -Force
            Remove-Item $zipFile -Force

            $istioctlPath = "$downloadDir\bin\istioctl.exe"
            Write-Host "Downloaded and extracted to: $downloadDir" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to download Istio" -ForegroundColor Red
            Write-Host "Please download manually from: https://github.com/istio/istio/releases" -ForegroundColor Yellow
            Write-Host "Then add istioctl to PATH or use -SkipDownload" -ForegroundColor Yellow
            exit 1
        }
    }

    if (-not $istioctlPath) {
        Write-Host "ERROR: istioctl not found. Please install Istio CLI first." -ForegroundColor Red
        Write-Host "Download from: https://github.com/istio/istio/releases" -ForegroundColor Yellow
        exit 1
    }
}

# Verify kubectl context
Write-Host ""
Write-Host "Current kubectl context:" -ForegroundColor Yellow
$context = kubectl config current-context
Write-Host $context -ForegroundColor White

Write-Host ""
if (-not $Force) {
    $confirmation = Read-Host "Is this the correct AKS cluster? (y/n)"
    if ($confirmation -ne 'y') {
        Write-Host "Please switch to the correct kubectl context and try again." -ForegroundColor Yellow
        Write-Host "Hint: az aks get-credentials --resource-group <rg> --name <aks-name>" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "Skipping confirmation (-Force specified)" -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Host ""
    Write-Host "=== DRY RUN MODE ===" -ForegroundColor Magenta
    Write-Host "Would execute the following:" -ForegroundColor Magenta
    Write-Host "1. & $istioctlPath install -f $IstioConfigDir\istio-config.yaml -y" -ForegroundColor White
    Write-Host "2. kubectl apply -f $IstioConfigDir\peer-authentication.yaml" -ForegroundColor White
    Write-Host "3. kubectl apply -f $IstioConfigDir\destination-rules.yaml" -ForegroundColor White
    Write-Host "4. kubectl apply -f $IstioConfigDir\namespace-injection.yaml" -ForegroundColor White
    exit 0
}

# Install Istio control plane
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Istio Control Plane" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$istioConfigFile = Join-Path $IstioConfigDir "istio-config.yaml"
if (Test-Path $istioConfigFile) {
    Write-Host "Using custom config: $istioConfigFile" -ForegroundColor Yellow
    & $istioctlPath install -f $istioConfigFile -y
} else {
    Write-Host "Using minimal profile (no custom config found)" -ForegroundColor Yellow
    & $istioctlPath install --set profile=minimal -y
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Istio installation failed" -ForegroundColor Red
    exit 1
}

# Wait for Istio to be ready
Write-Host ""
Write-Host "Waiting for Istio control plane to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/istiod -n istio-system

# Verify installation
Write-Host ""
Write-Host "Verifying Istio installation..." -ForegroundColor Yellow
& $istioctlPath verify-install

# Apply mTLS and authorization policies
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Step 2: Applying mTLS and Authorization Policies" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$peerAuthFile = Join-Path $IstioConfigDir "peer-authentication.yaml"
if (Test-Path $peerAuthFile) {
    Write-Host "Applying peer authentication (strict mTLS)..." -ForegroundColor Yellow
    kubectl apply -f $peerAuthFile
} else {
    Write-Host "WARNING: peer-authentication.yaml not found, skipping" -ForegroundColor Yellow
}

# Apply destination rules
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Step 3: Applying Destination Rules" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$destRulesFile = Join-Path $IstioConfigDir "destination-rules.yaml"
if (Test-Path $destRulesFile) {
    Write-Host "Applying destination rules (circuit breakers, connection pools)..." -ForegroundColor Yellow
    kubectl apply -f $destRulesFile
} else {
    Write-Host "WARNING: destination-rules.yaml not found, skipping" -ForegroundColor Yellow
}

# Apply namespace injection labels
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Step 4: Labeling Namespaces for Sidecar Injection" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$namespaceFile = Join-Path $IstioConfigDir "namespace-injection.yaml"
if (Test-Path $namespaceFile) {
    Write-Host "Applying namespace labels..." -ForegroundColor Yellow
    kubectl apply -f $namespaceFile
} else {
    Write-Host "WARNING: namespace-injection.yaml not found" -ForegroundColor Yellow
    Write-Host "Labeling armportal-backend namespace manually..." -ForegroundColor Yellow
    kubectl label namespace armportal-backend istio-injection=enabled --overwrite 2>$null
}

# Show status
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Istio Installation Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Istio System Pods:" -ForegroundColor Yellow
kubectl get pods -n istio-system

Write-Host ""
Write-Host "Namespaces with Istio injection enabled:" -ForegroundColor Yellow
kubectl get namespaces -l istio-injection=enabled

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart deployments to inject sidecars:" -ForegroundColor White
Write-Host "   kubectl rollout restart deployment -n armportal-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify mTLS is working:" -ForegroundColor White
Write-Host "   & $istioctlPath proxy-status" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View service mesh (optional):" -ForegroundColor White
Write-Host "   kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml" -ForegroundColor Gray
Write-Host "   & $istioctlPath dashboard kiali" -ForegroundColor Gray
Write-Host ""
