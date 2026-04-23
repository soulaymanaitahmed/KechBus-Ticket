import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./Styles/App.css";

import SideBar from "./Components/SideBar";


// Lazy Pages
const Dashboard = lazy(() => import("./Components/Dashboard"));
const Stats = lazy(() => import("./Components/Stats"));
const Tikets = lazy(() => import("./Components/Tikets"));
const Home = lazy(() => import("./Components/Home"));
const Login = lazy(() => import("./Components/Login"));
const Signin = lazy(() => import("./Components/Signin"));
const Contact = lazy(() => import("./Components/Contact"));

// A simple Layout component for the internal app
const AppLayout = ({ children }) => (
  <div className="App">
    <SideBar />
    <div className="main-content">{children}</div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Separated Pages (No Sidebar) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />

        {/* Internal Pages (With Sidebar) */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/stats"
          element={
            <AppLayout>
              <Stats />
            </AppLayout>
          }
        />
        <Route
          path="/tikets"
          element={
            <AppLayout>
              <Tikets />
            </AppLayout>
          }
          
        />
          <Route
          path="/contact"
          element={
              <Contact />
          }
        />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
