import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/AdminPanel.css";

function AdminPanel() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();

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

      <div className="admin-content">
        <div className="admin-section">
          <h3>Welcome to Admin Portal</h3>
          <p>You are successfully authenticated with GitHub.</p>
          <p>Future features will appear here:</p>
          <ul>
            <li>User management and permissions</li>
            <li>Approval workflows</li>
            <li>Audit logs</li>
            <li>Resource usage statistics</li>
            <li>Cost tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
