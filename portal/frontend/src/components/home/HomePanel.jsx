import { useEffect, useState } from "react";
import "../../styles/HomePanel.css";

/**
 * HomePanel component
 * Explains what the Cloud Self-Service Portal is and how it works
 */
function HomePanel({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch stats for the dashboard
    const fetchStats = async () => {
      try {
        const [catalogRes, resourcesRes, jobsRes] = await Promise.all([
          fetch("/api/catalog").then(r => r.ok ? r.json() : []),
          fetch("/api/resources").then(r => r.ok ? r.json() : { resources: [] }),
          fetch("/api/jobs").then(r => r.ok ? r.json() : [])
        ]);
        setStats({
          blueprints: Array.isArray(catalogRes) ? catalogRes.length : 0,
          resources: resourcesRes?.resources?.length || 0,
          jobs: Array.isArray(jobsRes) ? jobsRes.length : 0
        });
      } catch {
        // Stats are optional, show zeros on error
        setStats({ blueprints: 0, resources: 0, jobs: 0 });
      }
    };
    fetchStats();
  }, []);

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
            <span className="home-stat-value">{stats.blueprints}</span>
          ) : (
            <div className="home-stat-value-skeleton" />
          )}
          <span className="home-stat-label">Blueprints Available</span>
        </div>
        <div className="home-stat">
          {stats ? (
            <span className="home-stat-value">{stats.resources}</span>
          ) : (
            <div className="home-stat-value-skeleton" />
          )}
          <span className="home-stat-label">Resources Deployed</span>
        </div>
        <div className="home-stat">
          {stats ? (
            <span className="home-stat-value">{stats.jobs}</span>
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
              The Cloud Self-Service Portal enables developers and teams to provision approved
              cloud resources without needing direct access to cloud provider consoles or
              infrastructure-as-code repositories. Simply select a blueprint, fill in the
              required parameters, and submit your request.
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
          <h2 className="home-section-title">Technologies</h2>
          <div className="home-tech-grid">
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "#7B42BC" }}>
                {/* Terraform logo - official HashiCorp mark */}
                <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                  <path d="M22.5 11v14.4l12.5 7.2V18.2L22.5 11z" fill="white"/>
                  <path d="M37 18.2v14.4l12.5-7.2V11L37 18.2z" fill="white" fillOpacity="0.5"/>
                  <path d="M9 4v14.4l12.5 7.2V11.2L9 4z" fill="white" fillOpacity="0.5"/>
                  <path d="M22.5 38.6V53l12.5-7.2V31.4l-12.5 7.2z" fill="white"/>
                </svg>
              </div>
              <h3>Terraform</h3>
              <p>Infrastructure as Code for provisioning and managing cloud resources declaratively.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "#1572B6" }}>
                {/* Crossplane logo - stylized X with planes */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4l7 8-7 8h3l5.5-6.5L18 20h3l-7-8 7-8h-3l-5.5 6.5L7 4H4z" fill="white"/>
                </svg>
              </div>
              <h3>Crossplane</h3>
              <p>Kubernetes-native infrastructure provisioning using custom resource definitions.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "#EF7B4D" }}>
                {/* ArgoCD logo - octopus/squid shape */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="white"/>
                  <path d="M12 12c-2 0-3.5 1-4 2.5L6 20M12 12c2 0 3.5 1 4 2.5L18 20M12 12v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="6" cy="20" r="1.5" fill="white"/>
                  <circle cx="12" cy="20" r="1.5" fill="white"/>
                  <circle cx="18" cy="20" r="1.5" fill="white"/>
                </svg>
              </div>
              <h3>ArgoCD</h3>
              <p>GitOps continuous delivery tool for Kubernetes that syncs desired state from Git.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "#24292e" }}>
                {/* GitHub logo - Octocat mark */}
                <svg width="28" height="28" viewBox="0 0 98 96" fill="white">
                  <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                </svg>
              </div>
              <h3>GitHub</h3>
              <p>Pull request-based workflow for infrastructure changes with automated reviews.</p>
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
