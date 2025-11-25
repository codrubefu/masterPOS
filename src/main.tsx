import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { useCartStore } from "./app/store";
import { getConfig } from "./app/configLoader";
import "./styles/globals.css";

// Initialize casa from config
async function initializeCasa() {
  try {
    const config = await getConfig();
    const apiBaseUrl = config.middleware?.apiBaseUrl || 'http://localhost:8082';
    const response = await fetch(`${apiBaseUrl}/api/config`);
    if (response.ok) {
      const data = await response.json();
      if (data.casa) {
        useCartStore.getState().setCasa(data.casa);
      }
    }
  } catch (error) {
    console.error('Failed to fetch casa config:', error);
  }
}

// Initialize casa before rendering
initializeCasa().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </React.StrictMode>
  );
});
