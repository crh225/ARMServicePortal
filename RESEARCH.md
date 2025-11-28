
Research areas next

---

## Scaling & High Availability

- [ ] **HPA (Horizontal Pod Autoscaler)** - Auto-scale backend based on CPU/memory/custom metrics
- [ ] **PodDisruptionBudgets (PDB)** - Ensure minimum availability during node drains/updates
- [ ] **Multi-replica deployments** - Run 3+ replicas with anti-affinity rules
- [ ] **Resource requests/limits** - Properly tune for QoS guarantees

## Availability Zones

- [ ] **Topology spread constraints** - Distribute pods across AZs
- [ ] **Zone-aware scheduling** - Ensure stateful workloads (RabbitMQ, Redis) span zones
- [ ] **Zone distribution visualization** - Show AZ spread in portal UI
- [ ] **Cross-zone networking considerations** - Latency and cost implications


## Policy & Governance

- [ ] **Kyverno policies** - Require labels, enforce resource limits, block privileged containers
- [ ] **Gatekeeper/OPA** - Alternative policy engine with Rego
- [ ] **Network policies** - Namespace isolation, ingress/egress rules
- [ ] **RBAC visualization** - Who can deploy to what environment
- [ ] **Cost policies** - Block deployments exceeding budget thresholds
- [ ] **Audit logging** - Track all provisioning actions (who, what, when)

## GitOps & ArgoCD

- [ ] **ApplicationSets** - Dynamic app generation for multi-env
- [ ] **Sync waves** - Ordered deployment of dependent resources
- [ ] **Multi-cluster support** - Deploy to different AKS clusters

## Security

- [DONE] **Secret management** - External Secrets AKV
- [ ] **Pod Security Standards** - Enforce restricted/baseline profiles
- [ ] **Image scanning** - Trivy/Grype in CI pipeline
- [ ] **SBOM generation** - Software bill of materials
- [DONE] **mTLS** - Service mesh or cert-manager for inter-service encryption

## Developer Experience
- [DONE] **Resource TTL** - Auto-cleanup dev resources after X days
- [DONE] **PR preview environments** - Ephemeral namespaces per PR

---
