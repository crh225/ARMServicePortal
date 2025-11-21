import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      handleCallback(token);
      // Get the tab the user was on before login, or default to admin
      const returnTab = sessionStorage.getItem("returnTab") || "admin";
      sessionStorage.removeItem("returnTab");

      // Redirect to the previous tab with a small delay to ensure token is stored
      setTimeout(() => {
        navigate(`/?tab=${returnTab}`, { replace: true });
      }, 100);
    } else {
      // No token, redirect to home
      navigate("/", { replace: true });
    }
  }, [searchParams, handleCallback, navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "system-ui"
    }}>
      <div>Completing login...</div>
    </div>
  );
}

export default AuthCallback;
