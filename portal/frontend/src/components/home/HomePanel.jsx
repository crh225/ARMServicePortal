import { useEffect, useState } from "react";
import api from "../../services/api";
import AnimatedCounter from "../shared/AnimatedCounter";
import "../../styles/HomePanel.css";

/**
 * HomePanel component
 * Explains what the Cloud Self-Service Portal is and how it works
 */
function HomePanel({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch stats from the dedicated stats endpoint (server-side 12hr cache)
    const fetchStats = async () => {
      try {
        const data = await api.fetchHomeStats();
        setStats({
          blueprints: data.blueprints || 0,
          resources: data.resources || 0,
          jobs: data.jobs || 0
        });
      } catch {
        // Stats are optional, show zeros on error
        setStats({ blueprints: 0, resources: 0, jobs: 0 });
      }
    };
    fetchStats();
  }, []); // Run once on mount

  return (
    <div className="home-panel">
      <div className="home-header">
        <h1 className="home-title">Welcome to the Cloud Self-Service Portal</h1>
        <p className="home-subtitle">
          Provision approved cloud infrastructure through GitOps workflows - no cloud console access required.
        </p>
      </div>

      {/* Stats Row with CTA */}
      <div className="home-stats">
        <div className="home-stat">
          {stats ? (
            <span className="home-stat-value">
              <AnimatedCounter value={stats.blueprints} duration={2000} />
            </span>
          ) : (
            <div className="home-stat-value-skeleton" />
          )}
          <span className="home-stat-label">Blueprints Available</span>
        </div>
        <div className="home-stat">
          {stats ? (
            <span className="home-stat-value">
              <AnimatedCounter value={stats.resources} duration={2200} />
            </span>
          ) : (
            <div className="home-stat-value-skeleton" />
          )}
          <span className="home-stat-label">Resources Deployed</span>
        </div>
        <div className="home-stat">
          {stats ? (
            <span className="home-stat-value">
              <AnimatedCounter value={stats.jobs} duration={2400} />
            </span>
          ) : (
            <div className="home-stat-value-skeleton" />
          )}
          <span className="home-stat-label">Jobs Completed</span>
        </div>
        <button className="home-cta" onClick={() => onNavigate?.("blueprints")}>
          Get Started
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <div className="home-content">
        {/* Top Row - Overview and How It Works side by side */}
        <div className="home-row">
          {/* Overview Section */}
          <section className="home-section">
            <h2 className="home-section-title">What is this?</h2>
            <p className="home-text">
              This is Chris House's internal developer portal (IDP) — a personal sandbox for
              experimenting with cloud infrastructure patterns, GitOps workflows, and
              self-service provisioning. Use it to spin up resources like Redis, RabbitMQ,
              Azure resources, and more through pre-built blueprints.
            </p>
          </section>

          {/* How It Works Section */}
          <section className="home-section">
            <h2 className="home-section-title">How it works</h2>
            <div className="home-steps">
              <div className="home-step">
                <div className="home-step-number">1</div>
                <div className="home-step-content">
                  <h3>Select a Blueprint</h3>
                  <p>Choose from pre-approved infrastructure templates.</p>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">2</div>
                <div className="home-step-content">
                  <h3>Configure Parameters</h3>
                  <p>Fill in the required configuration options.</p>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">3</div>
                <div className="home-step-content">
                  <h3>Submit Request</h3>
                  <p>A pull request is automatically created.</p>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">4</div>
                <div className="home-step-content">
                  <h3>Review & Deploy</h3>
                  <p>Once merged, infrastructure is provisioned.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Technologies Section - Full Width */}
        <section className="home-section home-section--full">
          <h2 className="home-section-title">Technologies Used</h2>
          <div className="home-tech-grid">
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.simpleicons.org/terraform/844FBA"
                  alt="Terraform"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Terraform</h3>
              <p>Infrastructure as Code for provisioning and managing cloud resources declaratively.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg"
                  alt="Crossplane"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Crossplane</h3>
              <p>Kubernetes-native infrastructure provisioning using custom resource definitions.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.simpleicons.org/argo/EF7B4D"
                  alt="ArgoCD"
                  width="40"
                  height="40"
                />
              </div>
              <h3>ArgoCD</h3>
              <p>GitOps continuous delivery tool for Kubernetes that syncs desired state from Git.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.simpleicons.org/github/181717"
                  alt="GitHub"
                  width="40"
                  height="40"
                />
              </div>
              <h3>GitHub</h3>
              <p>Pull request-based workflow for infrastructure changes with automated reviews.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.simpleicons.org/kubernetes/326CE5"
                  alt="Kubernetes"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Kubernetes</h3>
              <p>Container orchestration platform running on AKS with auto-scaling and self-healing.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg"
                  alt="Redis"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Redis</h3>
              <p>In-memory data store for caching, session management, and real-time notifications.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://cdn.simpleicons.org/istio/466BB0"
                  alt="Istio"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Istio</h3>
              <p>Service mesh providing traffic management, security, and observability for microservices.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "transparent" }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg"
                  alt="Azure"
                  width="40"
                  height="40"
                />
              </div>
              <h3>Azure</h3>
              <p>Microsoft cloud platform hosting AKS, Key Vault, App Configuration, and Cost Management.</p>
            </div>
          </div>
        </section>

        {/* Bottom Row - GitOps and Help side by side */}
        <div className="home-row">
          {/* GitOps Workflow Section */}
          <section className="home-section">
            <h2 className="home-section-title">GitOps Workflow</h2>
            <p className="home-text">
              All infrastructure changes flow through Git, providing:
            </p>
            <ul className="home-list">
              <li><strong>Version Control</strong> — Complete history of changes</li>
              <li><strong>Code Review</strong> — Peer review before deployment</li>
              <li><strong>Audit Trail</strong> — Track who changed what and when</li>
              <li><strong>Rollback</strong> — Easy revert to previous configs</li>
              <li><strong>Consistency</strong> — Single source of truth</li>
            </ul>
          </section>

          {/* Support Section */}
          <section className="home-section">
            <h2 className="home-section-title">Need Help?</h2>
            <p className="home-text">
              If you have questions or need assistance, check the Jobs tab to monitor your
              provisioning requests, or contact the platform team for support.
            </p>
            <p className="home-text">
              Common tasks:
            </p>
            <ul className="home-list">
              <li><strong>Blueprints</strong> — Browse and provision resources</li>
              <li><strong>Jobs</strong> — Track provisioning requests</li>
              <li><strong>Resources</strong> — View deployed infrastructure</li>
              <li><strong>Admin</strong> — Dashboard and metrics</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HomePanel;
