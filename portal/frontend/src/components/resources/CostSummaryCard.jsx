import React from "react";
import CostProductsChart from "./CostProductsChart";
import CostBreakdowns from "./CostBreakdowns";
import "../../styles/resources/CostSummary.css";

/**
 * CostSummaryCard component
 * Displays cost summary with total, average, highest, and breakdowns
 */
function CostSummaryCard({ costSummary, costsLoading }) {
  if (costsLoading) {
    return (
      <div className="cost-summary">
        <div className="cost-summary-card cost-summary-card--loading">
          <div className="cost-summary-header">
            <div className="cost-summary-main">
              <div className="cost-summary-label">Total Monthly Cost</div>
              <div className="skeleton-bar skeleton-bar--xlarge"></div>
            </div>
            <div className="cost-summary-stats">
              <div className="cost-stat">
                <div className="cost-stat-label">Average</div>
                <div className="skeleton-bar skeleton-bar--medium"></div>
              </div>
              <div className="cost-stat">
                <div className="cost-stat-label">Highest</div>
                <div className="skeleton-bar skeleton-bar--medium"></div>
              </div>
            </div>
          </div>
          <div className="cost-summary-details">
            <div className="skeleton-bar skeleton-bar--small"></div>
            <div className="skeleton-bar skeleton-bar--small"></div>
          </div>
          <div className="cost-breakdowns">
            <div className="cost-breakdown">
              <div className="cost-breakdown-title">Top Environments</div>
              <div className="cost-breakdown-items">
                <div className="skeleton-breakdown-item">
                  <div className="skeleton-bar skeleton-bar--small"></div>
                  <div className="skeleton-bar skeleton-bar--bar"></div>
                </div>
                <div className="skeleton-breakdown-item">
                  <div className="skeleton-bar skeleton-bar--small"></div>
                  <div className="skeleton-bar skeleton-bar--bar"></div>
                </div>
              </div>
            </div>
            <div className="cost-breakdown">
              <div className="cost-breakdown-title">Top Blueprints</div>
              <div className="cost-breakdown-items">
                <div className="skeleton-breakdown-item">
                  <div className="skeleton-bar skeleton-bar--small"></div>
                  <div className="skeleton-bar skeleton-bar--bar"></div>
                </div>
                <div className="skeleton-breakdown-item">
                  <div className="skeleton-bar skeleton-bar--small"></div>
                  <div className="skeleton-bar skeleton-bar--bar"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!costSummary.hasAnyDisplayCost) {
    return null;
  }

  // Determine if we're showing actual costs or estimated (for label purposes)
  const showingActualCosts = costSummary.hasAnyCost;
  const highestCost = costSummary.highestDisplayCostResource
    ? (costSummary.highestDisplayCostResource.cost || costSummary.highestDisplayCostResource.estimatedMonthlyCost || 0)
    : 0;

  return (
    <div className="cost-summary">
      <div className="cost-summary-card">
        <div className="cost-summary-header">
          <div className="cost-summary-main">
            <div className="cost-summary-label">
              {showingActualCosts ? 'Total Monthly Cost' : 'Estimated Monthly Cost'}
            </div>
            <div className="cost-summary-amount">
              ${costSummary.totalDisplayCost.toFixed(2)}
            </div>
            {!showingActualCosts && (
              <div className="cost-summary-sublabel">
                Estimated (no actual usage yet)
              </div>
            )}
          </div>
          <div className="cost-summary-stats">
            <div className="cost-stat">
              <div className="cost-stat-label">Average</div>
              <div className="cost-stat-value">
                ${costSummary.avgDisplayCost.toFixed(2)}
              </div>
            </div>
            <div className="cost-stat">
              <div className="cost-stat-label">Highest</div>
              <div className="cost-stat-value">
                ${highestCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="cost-summary-details">
          <span className="cost-summary-detail">
            {costSummary.resourcesWithDisplayCost} resource{costSummary.resourcesWithDisplayCost !== 1 ? 's' : ''} with cost
          </span>
          {costSummary.resourcesNoCost > 0 && (
            <span className="cost-summary-detail cost-summary-detail--muted">
              {costSummary.resourcesNoCost} without cost data
            </span>
          )}
        </div>

        <CostProductsChart
          topProducts={costSummary.topDisplayProducts}
        />
        <CostBreakdowns costSummary={costSummary} />
      </div>
    </div>
  );
}

export default CostSummaryCard;
