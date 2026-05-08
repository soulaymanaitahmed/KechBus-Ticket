import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { FaLayerGroup, FaRoute, FaUserFriends } from "react-icons/fa";
import { BsFillGrid1X2Fill } from "react-icons/bs";
import { FaTicketSimple } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { RiLoginBoxFill } from "react-icons/ri";
import { FiActivity } from "react-icons/fi";
import { MdAttachMoney } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";

import axios from "axios";
import "../Styles/SideBar.css";

function SideBar({ adminRole, adminUsername }) {
  const [expand, setExpand] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active-link" : "");

  return (
    <div className="side-bar">
      <div className="sid-item sidebar-brand" onClick={() => setExpand(!expand)}>
        <FaLayerGroup className="sid-icons" />
        {expand && (
          <span className="side-names">
            <b>KechBus Ticket</b>
          </span>
        )}
      </div>

      {Number(adminRole) === 1 && (
        <div
          className="sid-item mar-top"
          onClick={() => navigate("/finances")}
          id={isActive("/finances")}
        >
          <MdAttachMoney className="sid-icons" />
          {expand && <span className="side-names">Finances</span>}
        </div>
      )}


      <div
        className="sid-item mar-top1"
        onClick={() => navigate("/lignes")}
        id={isActive("/lignes")}
      >
        <FaRoute className="sid-icons" />
        {expand && <span className="side-names">Lignes</span>}
      </div>

      <div
        className="sid-item mar-top1"
        onClick={() => navigate("/statistiques")}
        id={isActive("/statistiques")}
      >
        <IoStatsChart className="sid-icons" />
        {expand && <span className="side-names">Statistiques</span>}
      </div>

      {Number(adminRole) === 1 && (
      <div className="sid-item" onClick={() => navigate("/clients")}
        id={isActive("/clients")}
      >
        <FaUserFriends className="sid-icons" />
        {expand && <span className="side-names">Clients</span>}
      </div>
      )}

      {Number(adminRole) === 1 && (
        <div
          className="sid-item mar-top1"
          onClick={() => navigate("/logs")}
          id={isActive("/logs")}
        >
          <FiActivity className="sid-icons" />
          {expand && <span className="side-names">Logs</span>}
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-admin-profile">
          <div className="admin-avatar" title={adminUsername || "Admin"}>
            <FaUserCircle size={expand ? 32 : 24} />
          </div>
          {expand && (
            <div className="admin-info">
              <div className="sidebar-admin-name">
                {(adminUsername || "Admin").toUpperCase()}
              </div>
              <div className="sidebar-admin-role">
                {Number(adminRole) === 1 ? "Administrateur" : "Personnel"}
              </div>
            </div>
          )}
        </div>
        <div className="sid-item mar-top1 sidebar-logout" onClick={async () => {
          try {
            await axios.post("http://localhost:8866/admin/logout");
            navigate("/admin-login");
          } catch (err) {
            console.error("Logout failed", err);
            navigate("/admin-login");
          }
        }}>
          <RiLoginBoxFill className="sid-icons" />
          {expand && <span className="side-names">Logout</span>}
        </div>
      </div>
    </div>
  );
}

export default SideBar;
