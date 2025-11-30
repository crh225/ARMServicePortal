import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { FeaturePreferencesProvider } from "./contexts/FeaturePreferencesContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeaturePreferencesProvider>
          <App />
        </FeaturePreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
