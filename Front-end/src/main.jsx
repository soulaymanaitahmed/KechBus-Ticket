import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./Styles/index.css";
import App from "./App";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

// Configure axios to always send cookies cross-origin
axios.defaults.withCredentials = true;

// Dynamically route all API calls to the host serving the application
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes("localhost:8866")) {
    config.url = config.url.replace("localhost", window.location.hostname);
  }
  return config;
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <Router>
        <App />
      </Router>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
