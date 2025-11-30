import React, { useState, useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import "./styles/variables.css";
import "./styles/layout.css";
import Header from "./components/shared/Header";
import BlueprintsPanel from "./components/blueprints/BlueprintsPanel";
import JobsPanel from "./components/jobs/JobsPanel";
import ResourcesPanel from "./components/resources/ResourcesPanel";
import HomePanel from "./components/home/HomePanel";
import AdminPanel from "./components/admin/AdminPanel";
import AuthCallback from "./components/shared/AuthCallback";
import Footer from "./components/shared/Footer";
import ToastContainer from "./components/shared/Toast";
import useNotifications from "./hooks/useNotifications";
import notificationService from "./services/notificationService";
import { useFeatureFlag } from "./hooks/useFeatureFlags";
import { useFeaturePreferences } from "./contexts/FeaturePreferencesContext";

/**
 * Main App component
 * Manages only top-level navigation state - all business logic is delegated to panel components
 */
function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL query parameter if present
    return searchParams.get("tab") || "home";
  });
  const [updateResourceData, setUpdateResourceData] = useState(null);

  // Feature flag for notifications (user preference overrides server flag)
  const serverNotificationsEnabled = useFeatureFlag("notifications");
  const { getFeatureEnabled } = useFeaturePreferences();
  const notificationsEnabled = getFeatureEnabled("notifications", serverNotificationsEnabled);

  // Handle notification click - navigate to job
  const handleNotificationNavigate = (notification) => {
    if (notification.prNumber) {
      handleTabChange("jobs");
      // Update URL with job parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "jobs");
      newParams.set("job", notification.prNumber.toString());
      setSearchParams(newParams);
    }
  };

  // Initialize notifications
  const {
    notifications,
    unreadCount,
    toasts,
    markAsRead,
    markAllAsRead,
    removeToast,
    requestPermission
  } = useNotifications({
    pollingInterval: 30000, // Poll every 30 seconds
    enableBrowserNotifications: true,
    onNavigate: handleNotificationNavigate
  });

  // Request notification permission on mount
  useEffect(() => {
    if (notificationService.isSupported() && !notificationService.hasPermission()) {
      // Request permission after a short delay to avoid immediate prompts
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [requestPermission]);

  // Update tab when query parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Handle tab change and update URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear all query strings and only set the tab parameter
    const newParams = new URLSearchParams();
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };

  const handleUpdateResource = (job) => {
    setUpdateResourceData(job);
    handleTabChange("blueprints");
  };

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={
        <div className="app-root">
          <div className="app-shell">
            <Header
              activeTab={activeTab}
              onTabChange={handleTabChange}
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onNavigate={handleNotificationNavigate}
              onMarkAllAsRead={markAllAsRead}
            />

            <main className={`app-main ${(activeTab === "resources" || activeTab === "admin" || activeTab === "home") ? "app-main--full" : ""}`}>
              {activeTab === "blueprints" && (
                <BlueprintsPanel
                  updateResourceData={updateResourceData}
                  onClearUpdate={() => setUpdateResourceData(null)}
                />
              )}
              {activeTab === "jobs" && (
                <JobsPanel
                  isActive={true}
                  onUpdateResource={handleUpdateResource}
                />
              )}
              {activeTab === "resources" && (
                <ResourcesPanel
                  isActive={true}
                />
              )}
              {activeTab === "home" && (
                <HomePanel onNavigate={handleTabChange} />
              )}
              {activeTab === "admin" && (
                <AdminPanel />
              )}
            </main>

            <Footer />
          </div>

          {/* Toast notifications - only show when notifications feature is enabled */}
          {notificationsEnabled && (
            <ToastContainer
              toasts={toasts}
              onClose={removeToast}
              onNavigate={handleNotificationNavigate}
            />
          )}
        </div>
      } />
    </Routes>
  );
}

export default App;
