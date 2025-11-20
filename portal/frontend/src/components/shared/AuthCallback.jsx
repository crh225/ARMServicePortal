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
      // Redirect to home (the app will stay on whatever tab was active)
      // Use a small delay to ensure token is stored
      setTimeout(() => {
        navigate("/?tab=admin", { replace: true });
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
