import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import DashboardMetrics from "./DashboardMetrics";
import RecentActivityList from "./RecentActivityList";
import BackupsList from "./BackupsList";
import AdminUserFilter from "./AdminUserFilter";
import CacheViewer from "./CacheViewer";
import "../../styles/AdminPanel.css";

// Redis icon SVG component
const RedisIcon = ({ spinning = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={spinning ? "spinning" : ""}
  >
    <path d="M23.99 14.34c-.02.56-.57 1.01-1.53 1.47l-6.88 2.87c-.79.37-1.76.57-2.58.57-.82 0-1.43-.2-2.11-.52l-7.4-3.12c-.95-.45-1.47-.9-1.47-1.47v2.24c0 .57.52 1.14 1.47 1.58l7.4 3.12c.68.32 1.29.52 2.11.52.82 0 1.79-.2 2.58-.57l6.88-2.87c.96-.46 1.51-.91 1.53-1.47v-2.35zm0-4.77c-.02.56-.57 1.01-1.53 1.47l-6.88 2.87c-.79.37-1.76.57-2.58.57-.82 0-1.43-.2-2.11-.52l-7.4-3.12c-.95-.45-1.47-.9-1.47-1.47v2.24c0 .57.52 1.14 1.47 1.58l7.4 3.12c.68.32 1.29.52 2.11.52.82 0 1.79-.2 2.58-.57l6.88-2.87c.96-.46 1.51-.91 1.53-1.47V9.57zM1.02 7.1c0 .57.52 1.14 1.47 1.58l7.4 3.12c.68.32 1.29.52 2.11.52.82 0 1.79-.2 2.58-.57l6.88-2.87c.96-.46 1.53-.96 1.53-1.53s-.57-1.08-1.53-1.53L14.58 2.95c-.79-.37-1.76-.57-2.58-.57-.82 0-1.43.2-2.11.52L2.49 6c-.95.45-1.47.9-1.47 1.1z"/>
  </svg>
);

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
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  // Load cache stats on mount
  const loadCacheStats = useCallback(async () => {
    try {
      const result = await api.getCacheStats();
      setCacheStats(result);
    } catch (err) {
      console.error("Failed to load cache stats:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      loadCacheStats();
    }
  }, [isAuthenticated, loadCacheStats]);

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

  // Handle clear cache action
  const handleClearCache = async () => {
    if (cacheClearing) return;

    setCacheClearing(true);
    try {
      const result = await api.clearCache();
      console.log("Cache cleared:", result);

      // Clear local dashboard cache too
      dashboardCache = null;
      cacheTimestamp = null;

      // Reload cache stats
      await loadCacheStats();

      // Optionally refresh dashboard data
      await loadDashboardData(true);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    } finally {
      setCacheClearing(false);
    }
  };

  // Extract unique users from resources with counts
  const availableUsers = useMemo(() => {
    const userCounts = new Map();
    dashboardData.resources.forEach(resource => {
      if (resource.owner && resource.tags && Object.keys(resource.tags).some(key => key.startsWith("armportal"))) {
        userCounts.set(resource.owner, (userCounts.get(resource.owner) || 0) + 1);
      }
    });
    return Array.from(userCounts.entries())
      .map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => a.owner.localeCompare(b.owner));
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
    const successfulJobs = jobs.filter(j => j.status === "merged").length;
    const activeJobs = jobs.filter(j => j.status === "open").length;
    const failedJobs = jobs.filter(j => j.status === "closed" || j.status === "failed").length;

    // Success rate only includes completed jobs (successful + failed), not active/open jobs
    const completedJobs = successfulJobs + failedJobs;
    const successRate = completedJobs > 0 ? Math.round((successfulJobs / completedJobs) * 100) : 0;

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
          <button className="btn-login" onClick={() => login("admin")}>
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
        <div className="admin-header-actions">
          <button
            className="btn-clear-cache"
            onClick={handleClearCache}
            disabled={cacheClearing}
            title={cacheStats?.usingRedis ? "Clear Redis cache" : "Clear in-memory cache"}
          >
            <RedisIcon spinning={cacheClearing} />
            {cacheClearing ? "Clearing..." : "Clear Cache"}
            {cacheStats?.stats?.redis?.keys > 0 && (
              <span className="cache-stats">({cacheStats.stats.redis.keys})</span>
            )}
          </button>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {dashboardData.loading ? (
        <AdminDashboardSkeleton />
      ) : dashboardData.error ? (
        <div className="error-state">{dashboardData.error}</div>
      ) : (
        <>
          {/* User Filter */}
          <AdminUserFilter
            availableUsers={availableUsers}
            userFilter={userFilter}
            onFilterChange={setUserFilter}
            allResourcesCount={dashboardData.resources.filter(r =>
              r.tags && Object.keys(r.tags).some(key => key.startsWith("armportal"))
            ).length}
          />

          {/* Dashboard Metrics */}
          <DashboardMetrics metrics={metrics} />

          {/* Activity and Backups Section */}
          <div className="admin-section-grid">
            {/* Recent Activity */}
            <RecentActivityList jobs={dashboardData.jobs} />

            {/* Terraform Backups */}
            <BackupsList />
          </div>

          {/* Cache Viewer */}
          <CacheViewer />
        </>
      )}
    </div>
  );
}

export default AdminPanel;
