import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Use environment variable or default to localhost:4000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Return tab storage with 1-hour expiry
const RETURN_TAB_KEY = "returnTab";
const RETURN_TAB_TTL = 60 * 60 * 1000; // 1 hour

function setReturnTab(tab) {
  try {
    const data = {
      tab,
      timestamp: Date.now()
    };
    localStorage.setItem(RETURN_TAB_KEY, JSON.stringify(data));
    console.log("[Auth] Saved return tab:", tab, data);
  } catch (e) {
    console.error("[Auth] Failed to save return tab:", e);
  }
}

function getReturnTab() {
  try {
    const stored = localStorage.getItem(RETURN_TAB_KEY);
    console.log("[Auth] Getting return tab, stored value:", stored);
    if (stored) {
      const { tab, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      console.log("[Auth] Return tab:", tab, "age:", age, "expired:", age >= RETURN_TAB_TTL);
      if (age < RETURN_TAB_TTL) {
        return tab;
      }
      // Expired, clean up
      localStorage.removeItem(RETURN_TAB_KEY);
    }
  } catch (e) {
    console.error("[Auth] Failed to get return tab:", e);
  }
  return null;
}

function clearReturnTab() {
  try {
    localStorage.removeItem(RETURN_TAB_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("github_token"));

  // Fetch current user on mount and when token changes
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Identify user in LogRocket
        if (window.LogRocket && typeof window.LogRocket.identify === 'function') {
          try {
            window.LogRocket.identify(data.user.id.toString(), {
              name: data.user.name,
              login: data.user.login,
              email: data.user.email
            });
          } catch (e) {
            console.error("Failed to identify user in LogRocket:", e);
          }
        }
      } else {
        // Token invalid or expired
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (currentTab) => {
    try {
      // Save current tab before redirecting to login
      // Use passed tab, or fall back to URL param, or default to home
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      const tabToSave = currentTab || urlTab || "home";
      console.log("[Auth] Login called with:", { currentTab, urlTab, tabToSave });
      setReturnTab(tabToSave);

      // Get GitHub OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/github`);
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to GitHub OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to initiate login:", error);
    }
  };

  const handleCallback = (sessionToken) => {
    localStorage.setItem("github_token", sessionToken);
    setToken(sessionToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    localStorage.removeItem("github_token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    token,
    login,
    logout,
    handleCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Export helpers for AuthCallback
export { getReturnTab, clearReturnTab };
