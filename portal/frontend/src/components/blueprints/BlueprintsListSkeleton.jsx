import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/BlueprintsList.css";

/**
 * Skeleton loader for blueprints list
 * Shows placeholder cards while blueprints are loading
 */
function BlueprintsListSkeleton({ count = 4 }) {
  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h2 className="panel-title">Choose a Blueprint</h2>
        <p className="panel-help">
          Select an approved Terraform module to deploy.
        </p>
      </div>

      <div className="blueprint-list">
        {Array(count).fill(null).map((_, i) => (
          <div key={i} className="blueprint-card">
            <div className="blueprint-header">
              <SkeletonLoader type="text" width="180px" height="20px" />
              <SkeletonLoader type="badge" width="50px" height="22px" />
            </div>
            <div style={{ marginTop: "8px" }}>
              <SkeletonLoader type="text" width="100%" height="14px" />
              <div style={{ marginTop: "4px" }}>
                <SkeletonLoader type="text" width="80%" height="14px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BlueprintsListSkeleton;
