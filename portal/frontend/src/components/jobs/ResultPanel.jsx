import React from "react";
import EmptyState from "../shared/EmptyState";
import "../../styles/ResultPanel.css";

function ResultPanel({ result, error }) {
  return (
    <>
      <div>
        <h2 className="panel-title">Results</h2>
        <p className="panel-help">
          Track the GitHub Pull Request that will run Terraform via
          Actions.
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
              <span className="result-label">Resource file</span>
              <code className="result-code">{result.filePath}</code>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          message="No request submitted yet."
          subMessage="Select a blueprint, fill in parameters, then submit to create a PR."
        />
      )}
    </>
  );
}

export default ResultPanel;
