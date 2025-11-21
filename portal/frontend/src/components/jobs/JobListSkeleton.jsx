import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/JobsList.css";

/**
 * Skeleton loader for job list items
 * Matches the GitHub Actions-style layout with icon, title, metadata, and badges
 */
function JobListSkeleton({ count = 5 }) {
  return (
    <div className="jobs-list">
      <ul className="jobs-list">
        {Array(count).fill(null).map((_, i) => (
          <li key={i} className="job-item">
            <div className="job-item-content">
              <div className="job-item-main">
                {/* Status Icon */}
                <div className="job-status-icon">
                  <SkeletonLoader type="circle" width="16px" height="16px" />
                </div>

                <div className="job-content">
                  {/* Title line with environment badge */}
                  <div className="job-line">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <SkeletonLoader type="text" width="180px" height="15px" />
                      <SkeletonLoader type="badge" width="50px" height="20px" />
                    </div>
                  </div>

                  {/* Metadata row with three columns */}
                  <div className="job-meta">
                    {/* Left: Job number, author, date */}
                    <div className="job-meta-left">
                      <SkeletonLoader type="text" width="40px" height="13px" />
                      <SkeletonLoader type="text" width="80px" height="13px" />
                      <SkeletonLoader type="text" width="130px" height="13px" />
                    </div>

                    {/* Center: Branch badge */}
                    <div className="job-meta-center">
                      <SkeletonLoader type="badge" width="110px" height="20px" />
                    </div>

                    {/* Right: Status badge */}
                    <div className="job-meta-right">
                      <SkeletonLoader type="badge" width="60px" height="20px" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chevron */}
              <div className="job-chevron">
                <SkeletonLoader type="circle" width="16px" height="16px" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobListSkeleton;
