import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import "./Styles/App.css";

import SideBar from "./Components/SideBar";
const Dashboard = lazy(() => import("./Components/Dashboard"));
const Stats = lazy(() => import("./Components/Stats"));
const Tikets = lazy(() => import("./Components/Tikets"));

function App() {
  return (
    <div className="App">
      <SideBar />
      <div className="main-content">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/tikets" element={<Tikets />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
