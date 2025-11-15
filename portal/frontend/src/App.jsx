import React, { useEffect, useState } from "react";
import "./styles.css";

function App() {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);



  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div>
            <div className="logo-row">
              <span className="logo-text">Cloud Self-Service</span>
            </div>
            <p className="app-subtitle">
              Provision approved Azure resources through GitHub + Terraform,
              without opening a ticket.
            </p>
          </div>
          <nav className="app-nav">
            <button className="nav-pill nav-pill--active">Blueprints</button>
            <button className="nav-pill" disabled>
              Jobs (coming soon)
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


        </main>

        <footer className="app-footer">
          <span>built by: chouse</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
