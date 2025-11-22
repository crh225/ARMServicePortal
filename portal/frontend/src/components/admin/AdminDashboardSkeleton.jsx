import "../../styles/AdminPanel.css";

/**
 * AdminDashboardSkeleton component
 * Loading skeleton for the Admin Dashboard
 */
function AdminDashboardSkeleton() {
  return (
    <>
      {/* User Filter Skeleton */}
      <div className="admin-filters">
        <div className="filter-group">
          <div className="skeleton-bar skeleton-bar--small" style={{ width: '100px' }}></div>
          <div className="skeleton-bar skeleton-bar--medium" style={{ width: '300px' }}></div>
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="dashboard-metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card">
            <div className="metric-icon skeleton-icon"></div>
            <div className="metric-content">
              <div className="skeleton-bar skeleton-bar--xlarge" style={{ width: '80px', marginBottom: '8px' }}></div>
              <div className="skeleton-bar skeleton-bar--small" style={{ width: '120px', marginBottom: '4px' }}></div>
              <div className="skeleton-bar skeleton-bar--small" style={{ width: '90px' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="admin-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="activity-item">
              <div className="skeleton-icon" style={{ width: '32px', height: '32px' }}></div>
              <div className="activity-content" style={{ flex: 1 }}>
                <div className="skeleton-bar skeleton-bar--medium" style={{ width: '60%', marginBottom: '8px' }}></div>
                <div className="skeleton-bar skeleton-bar--small" style={{ width: '40%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminDashboardSkeleton;
