import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="mis-topbar">
      <div>
        <div className="mis-page-title">{title}</div>
        {subtitle && <div className="mis-page-subtitle">{subtitle}</div>}
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="badge-role">{user?.role}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>
      </div>
    </header>
  );
}

/** Wraps every authenticated page with the sidebar + topbar shell. */
function Layout({ title, subtitle, children }) {
  return (
    <div className="mis-shell">
      <Sidebar />
      <div className="mis-main">
        <Topbar title={title} subtitle={subtitle} />
        <main className="mis-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
