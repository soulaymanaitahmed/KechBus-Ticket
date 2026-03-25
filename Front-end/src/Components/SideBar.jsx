import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { FaLayerGroup } from "react-icons/fa";
import { BsFillGrid1X2Fill } from "react-icons/bs";
import { FaTicketSimple } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { RiLoginBoxFill } from "react-icons/ri";

import "../Styles/SideBar.css";

function SideBar() {
  const [expand, setExpand] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active-link" : "");

  return (
    <div className="side-bar">
      <div className="sid-item" onClick={() => setExpand(!expand)}>
        <FaLayerGroup className="sid-icons" />
        {expand && (
          <span className="side-names">
            <b>KechBus Ticket</b>
          </span>
        )}
      </div>

      <div
        className="sid-item mar-top"
        onClick={() => navigate("/dashboard")}
        id={isActive("/dashboard")}
      >
        <BsFillGrid1X2Fill className="sid-icons" />
        {expand && <span className="side-names">Dashboard</span>}
      </div>

      <div
        className="sid-item mar-top1"
        onClick={() => navigate("/tikets")}
        id={isActive("/tikets")}
      >
        <FaTicketSimple className="sid-icons" />
        {expand && <span className="side-names">Tikets</span>}
      </div>

      <div
        className="sid-item mar-top1"
        onClick={() => navigate("/stats")}
        id={isActive("/stats")}
      >
        <IoStatsChart className="sid-icons" />
        {expand && <span className="side-names">Stats</span>}
      </div>

      <div className="sid-item mar-top1" onClick={() => navigate("/login")}>
        <RiLoginBoxFill className="sid-icons" />
        {expand && <span className="side-names">LogIn</span>}
      </div>
    </div>
  );
}

export default SideBar;
