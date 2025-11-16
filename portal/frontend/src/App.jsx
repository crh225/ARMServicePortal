import React, { useEffect, useState } from "react";
import "./styles.css";

function App() {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blueprints");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/catalog`)
      .then((res) => res.json())
      .then(setBlueprints)
      .catch((err) => {
        console.error(err);
        setError("Failed to load blueprints");
      });
  }, []);

  const handleSelectBlueprint = (id) => {
    const bp = blueprints.find((b) => b.id === id) || null;
    setSelectedBlueprint(bp);
    setResult(null);
    setError(null);
    if (bp) {
      const initial = {};
      (bp.variables || []).forEach((v) => {
        initial[v.name] = v.default || "";
      });
      setFormValues(initial);
    } else {
      setFormValues({});
    }
  };

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!selectedBlueprint) return;
    setLoading(true);
    setError(null);
    setResult(null);

    fetch(`${API_BASE_URL}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprintId: selectedBlueprint.id,
        variables: formValues
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setError("Failed to submit request");
      });
  };
  const refreshJobs = () => {
    setJobsLoading(true);
    setJobsError(null);

    fetch(`${API_BASE_URL}/api/jobs`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load jobs");
        }
        return res.json();
      })
      .then((data) => {
        const safe = Array.isArray(data) ? data : [];
        setJobs(safe);

        if (safe.length > 0) {
          setSelectedJob((current) => {
            if (current) {
              const still = safe.find((j) => j.id === current.id);
              return still || safe[0];
            }
            return safe[0];
          });
        } else {
          setSelectedJob(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setJobsError(err.message || "Failed to load jobs");
      })
      .finally(() => {
        setJobsLoading(false);
      });
  };


  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div>
            <div className="logo-row">
              <span className="logo-text">Cloud Self-Service Portal</span>
            </div>
            <p className="app-subtitle">
              Provision approved Azure resources through GitOps + Terraform.
            </p>
          </div>
          <nav className="app-nav">
            <button
              className={
                "nav-pill" + (activeTab === "blueprints" ? " nav-pill--active" : "")
              }
              onClick={() => setActiveTab("blueprints")}
            >
              Blueprints
            </button>
            <button
              className={
                "nav-pill" + (activeTab === "jobs" ? " nav-pill--active" : "")
              }
              onClick={() => {
                setActiveTab("jobs");
                refreshJobs();
              }}
            >
              Jobs
            </button>
            <button className="nav-pill" disabled>
              Admin (coming soon)
            </button>
          </nav>
        </header>

        <main className="app-main">
          <section className="panel panel--left">
            <div>
              <h2 className="panel-title">1. Choose a Blueprint</h2>
              <p className="panel-help">
                These are your approved Terraform-backed building blocks.
              </p>
            </div>

            <div className="blueprint-list">
              {blueprints.map((bp) => (
                <button
                  key={bp.id}
                  className={
                    "blueprint-card" +
                    (selectedBlueprint?.id === bp.id
                      ? " blueprint-card--active"
                      : "")
                  }
                  onClick={() => handleSelectBlueprint(bp.id)}
                >
                  <h3 className="blueprint-title">{bp.displayName}</h3>
                  <p className="blueprint-desc">{bp.description}</p>
                </button>
              ))}

              {blueprints.length === 0 && (
                <div className="empty-state">
                  <p>No blueprints found yet.</p>
                  <p className="empty-state-sub">
                    Add modules in the infra folder and expose them via the API.
                  </p>
                </div>
              )}
            </div>

            {selectedBlueprint && (
              <div className="panel panel--form">
                <h2 className="panel-title">2. Parameters</h2>
                <p className="panel-help">
                  Values will be written into a Terraform module file in GitHub.
                </p>

                <div className="form-grid">
                  {(selectedBlueprint.variables || []).map((v) => (
                    <div key={v.name} className="form-field">
                      <label className="field-label">
                        {v.label}
                        {v.required && (
                          <span className="field-required">*</span>
                        )}
                      </label>
                      {v.type === "select" ? (
                        <select
                          className="field-input"
                          value={formValues[v.name] || ""}
                          onChange={(e) => handleChange(v.name, e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {(v.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="field-input"
                          type="text"
                          value={formValues[v.name] || ""}
                          onChange={(e) =>
                            handleChange(v.name, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="primary-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Creating GitHub PR..." : "Create GitHub PR"}
                </button>

                <p className="hint-text">
                  The portal never applies Terraform directly. It just opens a
                  reviewed PR in your repo.
                </p>
              </div>
            )}
          </section>

          <aside className="panel panel--right">
            {activeTab === "blueprints" ? (
              <>
            <div>
              <h2 className="panel-title">3. Result</h2>
              <p className="panel-help">
                Track the GitHub Pull Request that will run Terraform via Actions.
              </p>
            </div>

            {error && (
              <div className="alert alert--error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result ? (
              <div className="result-card">
                <div className="result-row">
                  <span className="result-label">Status</span>
                  <span className="result-value">{result.status}</span>
                </div>

                {result.pullRequestUrl && (
                  <div className="result-row">
                    <span className="result-label">Pull Request</span>
                    <a
                      className="result-link"
                      href={result.pullRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {result.pullRequestUrl}
                    </a>
                  </div>
                )}

                {result.branchName && (
                  <div className="result-row">
                    <span className="result-label">Branch</span>
                    <code className="result-code">{result.branchName}</code>
                  </div>
                )}

                {result.filePath && (
                  <div className="result-row">
                    <span className="result-label">Terraform file</span>
                    <code className="result-code">{result.filePath}</code>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>No request submitted yet.</p>
                <p className="empty-state-sub">
                  Select a blueprint, fill in parameters, then submit to create
                  a PR.
                </p>
              </div>
            )}

            <div className="terminal">
              <div className="terminal-header">
                <span className="dot dot--red" />
                <span className="dot dot--amber" />
                <span className="dot dot--green" />
                <span className="terminal-title">terraform-actions.log</span>
              </div>
              <div className="terminal-body">
                {result ? (
                  <>
                    <span className="terminal-line">
                      $ terraform init && terraform plan
                    </span>
                    <span className="terminal-line terminal-line--dim">
                      Running in GitHub Actions on PR merge…
                    </span>
                    <span className="terminal-line">
                      file: <code>{result.filePath}</code>
                    </span>
                    <span className="terminal-line">
                      branch: <code>{result.branchName}</code>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="terminal-line">
                      # Waiting for first request…
                    </span>
                    <span className="terminal-line terminal-line--dim">
                      Submit a blueprint to see the GitHub-driven Terraform
                      flow.
                    </span>
                  </>
                )}
              </div>
            </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="panel-title">Jobs</h2>
                  <p className="panel-help">
                    Recent self-service requests created as GitHub pull requests.
                  </p>
                </div>

                {jobsError && (
                  <div className="alert alert--error">
                    <strong>Error:</strong> {jobsError}
                  </div>
                )}

                {jobsLoading && (
                  <div className="empty-state">
                    <p>Loading jobs…</p>
                  </div>
                )}

                {!jobsLoading && !jobsError && (
                  <>
                    {jobs.length === 0 ? (
                      <div className="empty-state">
                        <p>No jobs found yet.</p>
                        <p className="empty-state-sub">
                          Submit a request from the Blueprints tab to see it here.
                        </p>
                      </div>
                    ) : (
                      <div className="jobs-list">
                        <ul className="jobs-list">
                          {jobs.map((job) => (
                            <li
                              key={job.id}
                              className={
                                "job-item" +
                                (selectedJob && selectedJob.id === job.id ? " job-item--active" : "")
                              }
                              onClick={() => setSelectedJob(job)}
                            >
                              <div className="job-line">
                                <span className="job-title">
                                  {job.blueprintId || "Provision request"}
                                </span>
                                <span
                                  className={`job-status job-status--${job.status || "unknown"}`}
                                >
                                  {job.status || "unknown"}
                                </span>
                              </div>

                              <div className="job-meta">
                                env: {job.environment || "n/a"} · #{job.number} ·{" "}
                                {job.createdAt
                                  ? new Date(job.createdAt).toLocaleString()
                                  : "time unknown"}
                              </div>
                            </li>
                          ))}
                        </ul>

                      </div>
                    )}

                    {selectedJob && (
                      <div className="result-card jobs-detail">
                        <div className="result-row">
                          <span className="result-label">Status</span>
                          <span className="result-value">
                            {selectedJob.status}
                          </span>
                        </div>
                        {selectedJob.pullRequestUrl && (
                          <div className="result-row">
                            <span className="result-label">Pull Request</span>
                            <a
                              className="result-link"
                              href={selectedJob.pullRequestUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View on GitHub
                            </a>
                          </div>
                        )}
                        {selectedJob.headRef && (
                          <div className="result-row">
                            <span className="result-label">Branch</span>
                            <span className="result-value">
                              {selectedJob.headRef}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </aside>
        </main>

        <footer className="app-footer">
          <span>built by: chouse</span>
        </footer>
      </div>
    </div>
  );
}

export default App;