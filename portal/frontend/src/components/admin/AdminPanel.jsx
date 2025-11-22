import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import "../../styles/AdminPanel.css";

// Cache for dashboard data (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let dashboardCache = null;
let cacheTimestamp = null;

function AdminPanel() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    resources: [],
    jobs: [],
    loading: true,
    error: null
  });
  const [userFilter, setUserFilter] = useState("all");

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && dashboardCache && cacheTimestamp) {
      const cacheAge = Date.now() - cacheTimestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log(`Using cached dashboard data (${Math.round(cacheAge / 1000)}s old)`);
        setDashboardData({
          ...dashboardCache,
          loading: false,
          error: null
        });
        return;
      }
    }

    try {
      const [resources, jobs] = await Promise.all([
        api.fetchResources(),
        api.fetchJobs()
      ]);

      const data = {
        resources: Array.isArray(resources) ? resources : [],
        jobs: Array.isArray(jobs) ? jobs : [],
        loading: false,
        error: null
      };

      // Update cache
      dashboardCache = {
        resources: data.resources,
        jobs: data.jobs
      };
      cacheTimestamp = Date.now();
      console.log("Dashboard data cached");

      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard data"
      }));
    }
  };

  // Extract unique users from resources
  const availableUsers = useMemo(() => {
    const users = new Set();
    dashboardData.resources.forEach(resource => {
      if (resource.owner) {
        users.add(resource.owner);
      }
    });
    return Array.from(users).sort();
  }, [dashboardData.resources]);

  // Filter resources by user
  const filteredResources = useMemo(() => {
    if (userFilter === "all") {
      return dashboardData.resources;
    }
    return dashboardData.resources.filter(r => r.owner === userFilter);
  }, [dashboardData.resources, userFilter]);

  const calculateMetrics = () => {
    const { jobs } = dashboardData;
    const resources = filteredResources;

    // Only count ARM Portal managed resources (those with armportal-* tags)
    const managedResources = resources.filter(r =>
      r.tags && Object.keys(r.tags).some(key => key.startsWith("armportal"))
    );

    // Resource metrics
    const totalResources = managedResources.length;
    const healthyResources = managedResources.filter(r =>
      r.health?.toLowerCase() === "healthy" || r.health?.toLowerCase() === "succeeded"
    ).length;

    // Job metrics
    const totalJobs = jobs.length;
    const successfulJobs = jobs.filter(j => j.status === "merged" || j.status === "closed").length;
    const activeJobs = jobs.filter(j => j.status === "open").length;
    const failedJobs = jobs.filter(j => j.status === "failed").length;

    const successRate = totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0;

    // Cost metrics - prioritize actual costs over estimated
    let totalActualCost = 0;
    let totalEstimatedCost = 0;
    let resourcesWithCost = 0;
    let resourcesWithEstimatedCost = 0;

    managedResources.forEach(resource => {
      // Actual cost (from Cost Management API)
      if (resource.cost !== null && resource.cost !== undefined) {
        totalActualCost += resource.cost;
        resourcesWithCost++;
      }

      // Estimated monthly cost (from SKU/capacity)
      if (resource.estimatedMonthlyCost !== null && resource.estimatedMonthlyCost !== undefined) {
        totalEstimatedCost += resource.estimatedMonthlyCost;
        resourcesWithEstimatedCost++;
      }
    });

    return {
      totalResources,
      healthyResources,
      totalJobs,
      successfulJobs,
      activeJobs,
      failedJobs,
      successRate,
      totalEstimatedCost,
      totalActualCost,
      hasActualCosts: resourcesWithCost > 0,
      hasEstimatedCosts: resourcesWithEstimatedCost > 0
    };
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-login-card">
          <h2>Admin Portal</h2>
          <p>Sign in with your GitHub account to access admin features.</p>
          <button className="btn-login" onClick={login}>
            Login with GitHub
          </button>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="user-info">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="user-avatar"
          />
          <div className="user-details">
            <h3>{user.name || user.login}</h3>
            <p>@{user.login}</p>
            {user.email && <p className="user-email">{user.email}</p>}
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>

      {dashboardData.loading ? (
        <AdminDashboardSkeleton />
      ) : dashboardData.error ? (
        <div className="error-state">{dashboardData.error}</div>
      ) : (
        <>
          {/* User Filter */}
          {availableUsers.length > 0 && (
            <div className="admin-filters">
              <div className="filter-group">
                <label htmlFor="user-filter">Filter by User:</label>
                <select
                  id="user-filter"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Users ({dashboardData.resources.filter(r =>
                    r.tags && Object.keys(r.tags).some(key => key.startsWith("armportal"))
                  ).length} resources)</option>
                  {availableUsers.map(owner => {
                    const count = dashboardData.resources.filter(r =>
                      r.owner === owner &&
                      r.tags &&
                      Object.keys(r.tags).some(key => key.startsWith("armportal"))
                    ).length;
                    return (
                      <option key={owner} value={owner}>
                        {owner} ({count} resources)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          <div className="dashboard-metrics">
            {/* Resources Card */}
            <div className="metric-card metric-card--resources">
              <div className="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L18.5 7.5 12 10.5 5.5 7.5 12 4.5zM4 9.5l7 3.5v7l-7-3.5v-7zm16 0v7l-7 3.5v-7l7-3.5z"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{metrics.totalResources}</div>
                <div className="metric-label">Total Resources</div>
                <div className="metric-subtitle">
                  {metrics.healthyResources} healthy
                </div>
              </div>
            </div>

            {/* Active Jobs Card */}
            <div className="metric-card metric-card--jobs">
              <div className="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{metrics.activeJobs}</div>
                <div className="metric-label">Active Jobs</div>
                <div className="metric-subtitle">
                  {metrics.totalJobs} total
                </div>
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="metric-card metric-card--success">
              <div className="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">{metrics.successRate}%</div>
                <div className="metric-label">Success Rate</div>
                <div className="metric-subtitle">
                  {metrics.successfulJobs} successful, {metrics.failedJobs} failed
                </div>
              </div>
            </div>

            {/* Cost Summary Card */}
            <div className="metric-card metric-card--cost">
              <div className="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <div className="metric-content">
                <div className="metric-value">
                  ${metrics.hasActualCosts
                    ? metrics.totalActualCost.toFixed(2)
                    : metrics.totalEstimatedCost.toFixed(2)}
                </div>
                <div className="metric-label">Monthly Cost</div>
                <div className="metric-subtitle">
                  {metrics.hasActualCosts ? "Actual (last 30 days)" : "Estimated"}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {dashboardData.jobs.slice(0, 10).map((job) => (
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
              {dashboardData.jobs.length === 0 && (
                <div className="empty-state">No recent activity</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel;
