import React from "react";
import "../../styles/resources/CostBreakdowns.css";

/**
 * CostBreakdowns component
 * Displays cost breakdowns by environment and blueprint
 */
function CostBreakdowns({ costSummary }) {
  return (
    <div className="cost-breakdowns">
      {/* Top Environments */}
      {costSummary.topEnvironments && costSummary.topEnvironments.length > 0 && (
        <div className="cost-breakdown">
          <div className="cost-breakdown-title">Top Environments</div>
          <div className="cost-breakdown-items">
            {costSummary.topEnvironments.map(([env, cost]) => (
              <div key={env} className="cost-breakdown-item">
                <span className="cost-breakdown-label">{env}</span>
                <span className="cost-breakdown-value">${cost.toFixed(2)}</span>
                <div className="cost-breakdown-bar">
                  <div
                    className="cost-breakdown-bar-fill"
                    style={{ width: `${(cost / costSummary.totalCost) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Blueprints */}
      {costSummary.topBlueprints && costSummary.topBlueprints.length > 0 && (
        <div className="cost-breakdown">
          <div className="cost-breakdown-title">Top Blueprints</div>
          <div className="cost-breakdown-items">
            {costSummary.topBlueprints.map(([bp, cost]) => (
              <div key={bp} className="cost-breakdown-item">
                <span className="cost-breakdown-label">{bp}</span>
                <span className="cost-breakdown-value">${cost.toFixed(2)}</span>
                <div className="cost-breakdown-bar">
                  <div
                    className="cost-breakdown-bar-fill"
                    style={{ width: `${(cost / costSummary.totalCost) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CostBreakdowns;
