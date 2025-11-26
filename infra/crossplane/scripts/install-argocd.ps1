# Install Argo CD on AKS Crossplane Cluster
# This provides GitOps-based deployment and UI for Crossplane resources

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Installing Argo CD for Crossplane Visualization   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Create argocd namespace
Write-Host "Creating argocd namespace..." -ForegroundColor Yellow
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

Write-Host ""
Write-Host "Installing Argo CD..." -ForegroundColor Yellow
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host ""
Write-Host "Waiting for Argo CD to be ready (this may take 2-3 minutes)..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  Argo CD Installation Complete!                    " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Getting initial admin password..." -ForegroundColor Yellow
$adminPassword = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Access Information                                " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To access Argo CD UI, run the following command in a NEW terminal:" -ForegroundColor White
Write-Host ""
Write-Host "  kubectl port-forward svc/argocd-server -n argocd 8080:443" -ForegroundColor Green
Write-Host ""
Write-Host "Then open your browser to:" -ForegroundColor White
Write-Host "  https://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor Green
Write-Host "  Password: $adminPassword" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Save this password! It won't be shown again." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Port-forward to access the UI (command above)" -ForegroundColor White
Write-Host "2. Login with the credentials above" -ForegroundColor White
Write-Host "3. Navigate to Applications to see Crossplane resources" -ForegroundColor White
Write-Host ""
