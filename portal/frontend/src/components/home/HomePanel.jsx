import "../../styles/HomePanel.css";

/**
 * HomePanel component
 * Explains what the Cloud Self-Service Portal is and how it works
 */
function HomePanel() {
  return (
    <div className="home-panel">
      <div className="home-header">
        <h1 className="home-title">Cloud Self-Service Portal</h1>
        <p className="home-subtitle">
          A self-service platform for provisioning cloud infrastructure through GitOps workflows.
        </p>
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
              <div className="home-tech-icon" style={{ background: "linear-gradient(135deg, #7B42BC, #5C4EE5)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z"/>
                </svg>
              </div>
              <h3>Terraform</h3>
              <p>Infrastructure as Code for provisioning and managing cloud resources declaratively.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "linear-gradient(135deg, #1572B6, #0D5B99)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3>Crossplane</h3>
              <p>Kubernetes-native infrastructure provisioning using custom resource definitions.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "linear-gradient(135deg, #EF7B4D, #E05D44)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
                </svg>
              </div>
              <h3>ArgoCD</h3>
              <p>GitOps continuous delivery tool for Kubernetes that syncs desired state from Git.</p>
            </div>
            <div className="home-tech-card">
              <div className="home-tech-icon" style={{ background: "linear-gradient(135deg, #24292e, #1b1f23)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
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
