import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./Styles/index.css";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { GoogleMapsProvider } from "./providers/GoogleMapsProvider";

registerSW({ immediate: true });

import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

// Configure axios to always send cookies cross-origin
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleMapsProvider>
        <Router>
          <App />
        </Router>
      </GoogleMapsProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
