import React from "react";
import "../styles/Header.css";

function Header({ activeTab, onTabChange }) {
  return (
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
            "nav-pill" +
            (activeTab === "blueprints" ? " nav-pill--active" : "")
          }
          onClick={() => onTabChange("blueprints")}
        >
          Blueprints
        </button>
        <button
          className={
            "nav-pill" + (activeTab === "jobs" ? " nav-pill--active" : "")
          }
          onClick={() => onTabChange("jobs")}
        >
          Jobs
        </button>
        <button className="nav-pill" disabled>
          Admin (coming soon)
        </button>
      </nav>
    </header>
  );
}

export default Header;
