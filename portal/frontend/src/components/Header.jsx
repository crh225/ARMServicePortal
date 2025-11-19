import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";

function Header({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
      <div>
        <div className="logo-row">
          <span className="logo-text">Cloud Self-Service Portal</span>
        </div>
        <p className="app-subtitle">
          Provision approved Azure resources through GitOps + Terraform.
        </p>
      </div>
      <div className="header-right">
        <nav className="app-nav">
          <button
            className={
              "nav-pill" +
              (activeTab === "blueprints" ? " nav-pill--active" : "")
            }
            onClick={() => onTabChange("blueprints")}
          >
            Blueprints
          </button>
          <button
            className={
              "nav-pill" + (activeTab === "jobs" ? " nav-pill--active" : "")
            }
            onClick={() => onTabChange("jobs")}
          >
            Jobs
          </button>
          <button
            className={
              "nav-pill" + (activeTab === "resources" ? " nav-pill--active" : "")
            }
            onClick={() => onTabChange("resources")}
          >
            Resources
          </button>
          <button
            className={
              "nav-pill" + (activeTab === "admin" ? " nav-pill--active" : "")
            }
            onClick={() => onTabChange("admin")}
          >
            Admin
          </button>
        </nav>
        {user && (
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
                <button className="user-dropdown-logout" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
