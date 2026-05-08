import React, { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Styles/App.css";

import SideBar from "./Components/SideBar";
import Statistiques from "./Components/Statistiques";

axios.defaults.withCredentials = true;


// Lazy Pages
const Finances = lazy(() => import("./Components/Finances"));
const TicketsPage = lazy(() => import("./Components/TicketsPage"));
const Lignes = lazy(() => import("./Components/Lignes"));
const Home = lazy(() => import("./Components/Home"));
const Login = lazy(() => import("./Components/Login"));
const Signin = lazy(() => import("./Components/Signin"));
const Contact = lazy(() => import("./Components/Contact"));
const AdminLogin = lazy(() => import("./Components/AdminLogin"));
const Logs = lazy(() => import("./Components/Logs"));
const BusScanner = lazy(() => import("./Components/BusScanner"));
const Clients = lazy(() => import("./Components/Clients"));

// A Layout component for the internal app that checks authentication
const AppLayout = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8866/admin/me")
      .then(res => {
        setAdmin(res.data);
        setLoading(false);
      })
      .catch(() => {
        navigate("/admin-login");
      });
  }, [navigate]);

  if (loading) return <div style={{ background: '#f9f5f0', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Vérification Admin...</div>;

  return (
    <div className="App">
      <SideBar adminRole={admin?.a_role} adminUsername={admin?.a_username} />
      <div className="main-content">{children}</div>
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Separated Pages (No Sidebar) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/bus" element={<BusScanner />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signin />} />

        {/* Internal Pages (With Sidebar) */}
        <Route
          path="/finances"
          element={
            <AppLayout>
              <Finances />
            </AppLayout>
          }
        />
        <Route
          path="/statistiques"
          element={
            <AppLayout>
              <Statistiques />
            </AppLayout>
          }
        />
        <Route
          path="/logs"
          element={
            <AppLayout>
              <Logs />
            </AppLayout>
          }
        />
        <Route
          path="/lignes"
          element={
            <AppLayout>
              <Lignes />
            </AppLayout>
          }
        />
        <Route path="/tickets" element={<TicketsPage />} />
          <Route
          path="/contact"
          element={
              <Contact />
          }
        />

        {/* Redirect unknown routes to home */}
        <Route
          path="/clients"
          element={
            <AppLayout>
              <Clients />
            </AppLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
