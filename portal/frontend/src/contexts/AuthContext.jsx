import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Use environment variable or default to localhost:4000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

  const login = async () => {
    try {
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
