# Istio Service Mesh Setup

## Installation

### 1. Install Istio CLI (one-time)
```bash
# Windows (PowerShell)
curl -L https://istio.io/downloadIstio | sh -

# Or download from https://github.com/istio/istio/releases
```

### 2. Install Istio on AKS
```bash
# Install with minimal profile (production-ready, no extras)
istioctl install -f istio-config.yaml -y

# Verify installation
istioctl verify-install
kubectl get pods -n istio-system
```

### 3. Apply mTLS and namespace configs
```bash
kubectl apply -f peer-authentication.yaml
kubectl apply -f namespace-injection.yaml
```

### 4. Restart pods to inject sidecars
```bash
# Restart deployments to get Istio sidecars
kubectl rollout restart deployment -n armportal-backend
# Crossplane-managed pods will need their namespaces labeled before creation
```

## Verify mTLS

```bash
# Check if mTLS is working
istioctl x describe pod <pod-name> -n armportal-backend

# View proxy status
istioctl proxy-status
```

## Monitoring (Optional)

```bash
# Install Kiali dashboard
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml

# Access dashboard
istioctl dashboard kiali
```
