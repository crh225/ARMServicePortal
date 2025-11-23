import React, { useState, useEffect } from "react";
import api from "../../services/api";
import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/CostEstimate.css";

function CostEstimate({ blueprint, formValues }) {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!blueprint || !formValues) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchEstimate();
    }, 500);

    return () => clearTimeout(timer);
  }, [blueprint, formValues]);

  const fetchEstimate = async () => {
    if (!blueprint) return;

    // Only show loading if we don't have an estimate yet
    // This prevents flashing when re-calculating
    if (!estimate) {
      setLoading(true);
    } else {
      setUpdating(true);
    }
    setError(null);

    try {
      const data = await api.getCostEstimate(blueprint.id, formValues);
      setEstimate(data);
    } catch (err) {
      console.error("Error fetching cost estimate:", err);
      setError("Unable to fetch cost estimate");
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  if (!blueprint) return null;

  return (
    <div className={`cost-estimate ${updating ? "cost-estimate--updating" : ""}`}>
      <h3 className="cost-estimate__title">
        💰 Estimated Monthly Cost
        {updating && <span className="cost-estimate__updating-indicator"> (Updating...)</span>}
      </h3>

      {loading && (
        <div className="cost-estimate__loading">
          <SkeletonLoader type="title" width="40%" />
          <div style={{ marginTop: "1rem" }}>
            <SkeletonLoader type="card" height="80px" />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <SkeletonLoader type="text" count={3} />
          </div>
        </div>
      )}

      {error && (
        <div className="cost-estimate__error">
          {error}
        </div>
      )}

      {estimate && !loading && (
        <>
          <div className="cost-estimate__total">
            <span className="cost-estimate__amount">
              ${estimate.totalMonthlyEstimate.toFixed(2)}
            </span>
            <span className="cost-estimate__currency">USD/month</span>
          </div>

          {estimate.estimates && estimate.estimates.length > 0 && (
            <div className="cost-estimate__breakdown">
              <div className="cost-estimate__breakdown-title">Breakdown:</div>
              {estimate.estimates.map((item, idx) => (
                <div key={idx} className="cost-estimate__item">
                  <div className="cost-estimate__item-header">
                    <span className="cost-estimate__item-type">{item.resourceType}</span>
                    <span className="cost-estimate__item-price">
                      {item.monthlyEstimate !== null && item.monthlyEstimate !== undefined
                        ? `$${item.monthlyEstimate.toFixed(2)}`
                        : "N/A"}
                    </span>
                  </div>
                  {item.skuName && item.skuName !== "N/A" && (
                    <div className="cost-estimate__item-sku">{item.skuName}</div>
                  )}
                  {item.note && (
                    <div className="cost-estimate__item-note">{item.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {estimate.disclaimer && (
            <div className="cost-estimate__disclaimer">
              ⓘ {estimate.disclaimer}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CostEstimate;
