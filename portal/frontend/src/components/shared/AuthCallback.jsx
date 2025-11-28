import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, getReturnTab, clearReturnTab } from "../../contexts/AuthContext";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions due to React re-renders
    if (processedRef.current) {
      return;
    }

    const token = searchParams.get("token");

    if (token) {
      processedRef.current = true;

      // Get the tab BEFORE calling handleCallback (which triggers re-renders)
      const returnTab = getReturnTab() || "home";
      clearReturnTab();

      // Now handle the token
      handleCallback(token);

      // Redirect to the previous tab with a small delay to ensure token is stored
      const redirectUrl = `/?tab=${returnTab}`;
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
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
