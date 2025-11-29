import React from "react";
import "../../styles/resources/CostBreakdowns.css";

/**
 * CostBreakdowns component
 * Displays cost breakdowns by environment and blueprint
 * Uses unified display costs (actual if available, otherwise estimated)
 */
function CostBreakdowns({ costSummary }) {
  // Use display cost fields for consistency with other views
  const topEnvironments = costSummary.topDisplayEnvironments || costSummary.topEnvironments || [];
  const topBlueprints = costSummary.topDisplayBlueprints || costSummary.topBlueprints || [];
  const totalCost = costSummary.totalDisplayCost || costSummary.totalCost || 0;

  return (
    <div className="cost-breakdowns">
      {/* Top Environments */}
      {topEnvironments.length > 0 && (
        <div className="cost-breakdown">
          <div className="cost-breakdown-title">Top Environments</div>
          <div className="cost-breakdown-items">
            {topEnvironments.map(([env, cost]) => (
              <div key={env} className="cost-breakdown-item">
                <span className="cost-breakdown-label">{env}</span>
                <span className="cost-breakdown-value">${cost.toFixed(2)}</span>
                <div className="cost-breakdown-bar">
                  <div
                    className="cost-breakdown-bar-fill"
                    style={{ width: `${totalCost > 0 ? (cost / totalCost) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Blueprints */}
      {topBlueprints.length > 0 && (
        <div className="cost-breakdown">
          <div className="cost-breakdown-title">Top Blueprints</div>
          <div className="cost-breakdown-items">
            {topBlueprints.map(([bp, cost]) => (
              <div key={bp} className="cost-breakdown-item">
                <span className="cost-breakdown-label">{bp}</span>
                <span className="cost-breakdown-value">${cost.toFixed(2)}</span>
                <div className="cost-breakdown-bar">
                  <div
                    className="cost-breakdown-bar-fill"
                    style={{ width: `${totalCost > 0 ? (cost / totalCost) * 100 : 0}%` }}
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
