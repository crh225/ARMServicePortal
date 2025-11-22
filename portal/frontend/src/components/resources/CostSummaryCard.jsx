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

  if (!costSummary.hasAnyCost && !costSummary.hasAnyEstimatedCost) {
    return null;
  }

  return (
    <div className="cost-summary">
      <div className="cost-summary-card">
        <div className="cost-summary-header">
          <div className="cost-summary-main">
            <div className="cost-summary-label">
              {costSummary.hasAnyEstimatedCost ? 'Estimated Monthly Cost' : 'Total Monthly Cost'}
            </div>
            <div className="cost-summary-amount">
              ${costSummary.hasAnyEstimatedCost ? costSummary.totalEstimatedCost.toFixed(2) : costSummary.totalCost.toFixed(2)}
            </div>
            {costSummary.hasAnyCost && costSummary.hasAnyEstimatedCost && (
              <div className="cost-summary-sublabel">
                Actual (last 30 days): ${costSummary.totalCost.toFixed(2)}
              </div>
            )}
          </div>
          <div className="cost-summary-stats">
            <div className="cost-stat">
              <div className="cost-stat-label">Average</div>
              <div className="cost-stat-value">
                ${costSummary.hasAnyEstimatedCost ? costSummary.avgEstimatedCost.toFixed(2) : costSummary.avgCost.toFixed(2)}
              </div>
            </div>
            <div className="cost-stat">
              <div className="cost-stat-label">Highest</div>
              <div className="cost-stat-value">
                ${costSummary.hasAnyEstimatedCost
                  ? (costSummary.highestEstimatedCostResource?.estimatedMonthlyCost.toFixed(2) || '0.00')
                  : (costSummary.highestCostResource?.cost.toFixed(2) || '0.00')}
              </div>
            </div>
          </div>
        </div>

        <div className="cost-summary-details">
          {costSummary.hasAnyEstimatedCost ? (
            <>
              <span className="cost-summary-detail">
                {costSummary.resourcesWithEstimatedCost} resource{costSummary.resourcesWithEstimatedCost !== 1 ? 's' : ''} with estimated cost
              </span>
              {costSummary.hasAnyCost && (
                <span className="cost-summary-detail cost-summary-detail--muted">
                  {costSummary.resourcesWithCost} with actual usage cost
                </span>
              )}
            </>
          ) : (
            <>
              <span className="cost-summary-detail">
                {costSummary.resourcesWithCost} resource{costSummary.resourcesWithCost !== 1 ? 's' : ''} with cost
              </span>
              {costSummary.resourcesNoCost > 0 && (
                <span className="cost-summary-detail cost-summary-detail--muted">
                  {costSummary.resourcesNoCost} without cost data
                </span>
              )}
            </>
          )}
        </div>

        <CostProductsChart
          topProducts={costSummary.hasAnyEstimatedCost ? costSummary.topEstimatedProducts : costSummary.topProducts}
        />
        <CostBreakdowns costSummary={costSummary} />
      </div>
    </div>
  );
}

export default CostSummaryCard;
