# Download Istio helper script
$IstioVersion = "1.23.3"
$DownloadDir = "$env:USERPROFILE"

Write-Host "Downloading Istio $IstioVersion..." -ForegroundColor Cyan

# Clean up old version
$OldDir = Join-Path $DownloadDir "istio-1.24.0"
if (Test-Path $OldDir) {
    Write-Host "Removing old version..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $OldDir
}

$Url = "https://github.com/istio/istio/releases/download/$IstioVersion/istio-$IstioVersion-win.zip"
$ZipFile = Join-Path $DownloadDir "istio.zip"

Write-Host "Downloading from: $Url" -ForegroundColor White
Invoke-WebRequest -Uri $Url -OutFile $ZipFile -UseBasicParsing

Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $ZipFile -DestinationPath $DownloadDir -Force

Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $ZipFile -Force

$IstioCtl = Join-Path $DownloadDir "istio-$IstioVersion\bin\istioctl.exe"
Write-Host "Done! istioctl at: $IstioCtl" -ForegroundColor Green
