import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/ResourcesTable.css";

/**
 * Skeleton loader for resources table
 * Matches the actual layout with cost card, filters, and table
 */
function ResourcesTableSkeleton() {
  return (
    <div className="resources-container">
      {/* Cost Summary Card Skeleton */}
      <div className="cost-summary-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <SkeletonLoader type="text" width="120px" height="14px" />
            <div style={{ marginTop: "8px" }}>
              <SkeletonLoader type="title" width="140px" height="32px" />
            </div>
          </div>
          <SkeletonLoader type="badge" width="80px" height="24px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "12px" }}>
          <div>
            <SkeletonLoader type="text" width="60px" height="12px" />
            <div style={{ marginTop: "4px" }}>
              <SkeletonLoader type="text" width="50px" height="16px" />
            </div>
          </div>
          <div>
            <SkeletonLoader type="text" width="60px" height="12px" />
            <div style={{ marginTop: "4px" }}>
              <SkeletonLoader type="text" width="50px" height="16px" />
            </div>
          </div>
          <div>
            <SkeletonLoader type="text" width="60px" height="12px" />
            <div style={{ marginTop: "4px" }}>
              <SkeletonLoader type="text" width="50px" height="16px" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="resources-filters">
        <div className="filter-row">
          <div className="filter-group">
            <SkeletonLoader type="input" width="140px" height="32px" />
            <SkeletonLoader type="input" width="140px" height="32px" />
            <SkeletonLoader type="input" width="140px" height="32px" />
            <SkeletonLoader type="input" width="140px" height="32px" />
          </div>
          <div className="search-box">
            <SkeletonLoader type="input" width="200px" height="32px" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}></th>
              <th style={{ width: "25%" }}>
                <SkeletonLoader type="text" width="60px" height="14px" />
              </th>
              <th style={{ width: "20%" }}>
                <SkeletonLoader type="text" width="40px" height="14px" />
              </th>
              <th style={{ width: "15%" }}>
                <SkeletonLoader type="text" width="80px" height="14px" />
              </th>
              <th style={{ width: "12%" }}>
                <SkeletonLoader type="text" width="60px" height="14px" />
              </th>
              <th style={{ width: "12%" }}>
                <SkeletonLoader type="text" width="50px" height="14px" />
              </th>
              <th style={{ width: "11%" }}>
                <SkeletonLoader type="text" width="40px" height="14px" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array(8).fill(null).map((_, i) => (
              <tr key={i}>
                <td>
                  <SkeletonLoader type="circle" width="20px" height="20px" />
                </td>
                <td>
                  <SkeletonLoader type="text" width="80%" height="14px" />
                </td>
                <td>
                  <SkeletonLoader type="text" width="70%" height="14px" />
                </td>
                <td>
                  <SkeletonLoader type="text" width="90%" height="14px" />
                </td>
                <td>
                  <SkeletonLoader type="badge" width="60px" height="20px" />
                </td>
                <td>
                  <SkeletonLoader type="badge" width="70px" height="20px" />
                </td>
                <td>
                  <SkeletonLoader type="text" width="60px" height="14px" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className="resources-pagination">
        <SkeletonLoader type="text" width="120px" height="14px" />
        <div style={{ display: "flex", gap: "8px" }}>
          <SkeletonLoader type="button" width="80px" height="32px" />
          <SkeletonLoader type="button" width="80px" height="32px" />
        </div>
      </div>
    </div>
  );
}

export default ResourcesTableSkeleton;
