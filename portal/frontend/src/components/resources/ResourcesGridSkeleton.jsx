import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/ResourcesTable.css";

/**
 * Skeleton loader for resources table grid
 * Shows filters and table structure while data loads
 */
function ResourcesGridSkeleton() {
  return (
    <>
      {/* Table */}
      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th><SkeletonLoader type="text" width="60px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="40px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="70px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="80px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="50px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="90px" height="14px" /></th>
              <th><SkeletonLoader type="text" width="40px" height="14px" /></th>
            </tr>
          </thead>
          <tbody>
            {Array(8).fill(null).map((_, i) => (
              <tr key={i}>
                <td><SkeletonLoader type="text" width="90%" height="14px" /></td>
                <td><SkeletonLoader type="badge" width="60px" height="20px" /></td>
                <td><SkeletonLoader type="text" width="80px" height="14px" /></td>
                <td><SkeletonLoader type="text" width="100px" height="14px" /></td>
                <td><SkeletonLoader type="text" width="60px" height="14px" /></td>
                <td><SkeletonLoader type="text" width="120px" height="14px" /></td>
                <td><SkeletonLoader type="text" width="50px" height="14px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ResourcesGridSkeleton;
