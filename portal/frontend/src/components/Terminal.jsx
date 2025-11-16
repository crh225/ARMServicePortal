import React from "react";
import "../styles/Terminal.css";

function Terminal({ result }) {
  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="dot dot--red" />
        <span className="dot dot--amber" />
        <span className="dot dot--green" />
        <span className="terminal-title">
          terraform-actions.log
        </span>
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
  );
}

export default Terminal;
