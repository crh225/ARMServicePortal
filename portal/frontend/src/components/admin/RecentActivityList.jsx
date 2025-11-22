import "../../styles/AdminPanel.css";

/**
 * RecentActivityList component
 * Displays the recent PR/job activity feed
 */
function RecentActivityList({ jobs }) {
  return (
    <div className="admin-section">
      <h3>Recent Activity</h3>
      <div className="activity-list">
        {jobs.slice(0, 10).map((job) => (
          <div key={job.number} className="activity-item">
            <div className="activity-icon">
              {job.status === "merged" || job.status === "closed" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#10b981">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
              ) : job.status === "failed" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#ef4444">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#3b82f6">
                  <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                </svg>
              )}
            </div>
            <div className="activity-content">
              <div className="activity-title">{job.title}</div>
              <div className="activity-meta">
                PR #{job.number} • {job.status}
                {job.created_at && ` • ${new Date(job.created_at).toLocaleDateString()}`}
                {job.createdAt && !job.created_at && ` • ${new Date(job.createdAt).toLocaleDateString()}`}
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="empty-state">No recent activity</div>
        )}
      </div>
    </div>
  );
}

export default RecentActivityList;
