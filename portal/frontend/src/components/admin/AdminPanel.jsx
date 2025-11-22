import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import DashboardMetrics from "./DashboardMetrics";
import RecentActivityList from "./RecentActivityList";
import AdminUserFilter from "./AdminUserFilter";
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

          {/* Recent Activity */}
          <RecentActivityList jobs={dashboardData.jobs} />
        </>
      )}
    </div>
  );
}

export default AdminPanel;
