import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import { useFeatureFlag } from "../../hooks/useFeatureFlags";
import { useFeaturePreferences } from "../../contexts/FeaturePreferencesContext";
import "../../styles/Header.css";

function Header({ activeTab, onTabChange, notifications, unreadCount, onMarkAsRead, onNavigate, onMarkAllAsRead }) {
  const { user, logout, login } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Server-side feature flag for notifications
  const serverNotificationsEnabled = useFeatureFlag("notifications");

  // User preferences (can override server flags, defaults to server flag if not set)
  const { getFeatureEnabled, setFeatureEnabled } = useFeaturePreferences();
  const notificationsEnabled = getFeatureEnabled("notifications", serverNotificationsEnabled);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-top">
          <div>
            <div className="logo-row">
              <span className="logo-text" onClick={() => onTabChange("home")} style={{ cursor: "pointer" }}>
                Cloud Self-Service Portal
              </span>
            </div>
            <p className="app-subtitle">
              Provision approved cloud resources through GitOps.
            </p>
          </div>
          <div className="header-actions">
            {notificationsEnabled && notifications && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={onMarkAsRead}
                onNavigate={onNavigate}
                onMarkAllAsRead={onMarkAllAsRead}
              />
            )}
            {user ? (
              <div className="user-menu" ref={dropdownRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  title={user.name || user.login}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || user.login}
                      className="user-avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="user-avatar-fallback">
                      {(user.name || user.login).charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {showDropdown && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">{user.name || user.login}</div>
                      <div className="user-dropdown-username">@{user.login}</div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <div className="user-dropdown-section">
                      <div className="user-dropdown-section-title">Features</div>
                      <label className="feature-toggle">
                        <span className="feature-toggle-label">Notifications</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notificationsEnabled}
                          className={`toggle-pill ${notificationsEnabled ? "toggle-pill--on" : ""}`}
                          onClick={() => setFeatureEnabled("notifications", !notificationsEnabled)}
                        >
                          <span className="toggle-pill-knob" />
                        </button>
                      </label>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-logout" onClick={logout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => login(activeTab)} className="login-btn" title="Login with GitHub">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Login
              </button>
            )}
          </div>
        </div>
        <nav className="app-nav">
          <button
            className={
              "nav-tab" + (activeTab === "home" ? " nav-tab--active" : "")
            }
            onClick={() => onTabChange("home")}
          >
            Home
          </button>
          <button
            className={
              "nav-tab" +
              (activeTab === "blueprints" ? " nav-tab--active" : "")
            }
            onClick={() => onTabChange("blueprints")}
          >
            Blueprints
          </button>
          <button
            className={
              "nav-tab" + (activeTab === "jobs" ? " nav-tab--active" : "")
            }
            onClick={() => onTabChange("jobs")}
          >
            Jobs
          </button>
          <button
            className={
              "nav-tab" + (activeTab === "resources" ? " nav-tab--active" : "")
            }
            onClick={() => onTabChange("resources")}
          >
            Resources
          </button>
          <button
            className={
              "nav-tab" + (activeTab === "admin" ? " nav-tab--active" : "")
            }
            onClick={() => onTabChange("admin")}
          >
            Admin
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
