import React from "react";
import DonutChart from "../shared/DonutChart";
import "../../styles/resources/CostProductsChart.css";

/**
 * CostProductsChart component
 * Displays donut chart showing top products by cost
 */
function CostProductsChart({ topProducts }) {
  if (!topProducts || topProducts.length === 0) {
    return null;
  }

  // Use colorful variety (magenta, cyan, green, gray) - no gradients
  const colors = [
    '#d946ef', // Magenta
    '#06b6d4', // Cyan
    '#10b981', // Green
    '#94a3b8'  // Gray
  ];

  return (
    <div className="cost-products-chart">
      <div className="cost-products-title">Top products by charges</div>
      <div className="cost-products-content">
        <DonutChart
          data={topProducts.map(([product, cost], index) => ({
            label: product,
            value: cost,
            color: colors[index]
          }))}
          size={120}
          thickness={24}
        />
        <div className="cost-products-legend">
          {topProducts.map(([product, cost], index) => (
            <div key={product} className="cost-product-item">
              <div className="cost-product-header">
                <div
                  className="cost-product-color"
                  style={{ backgroundColor: colors[index] }}
                ></div>
                <span className="cost-product-label">{product}</span>
              </div>
              <div className="cost-product-value">${cost.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CostProductsChart;
