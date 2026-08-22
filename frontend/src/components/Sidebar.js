import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const adminLinks = [
    { to: "/admin", icon: "bi-speedometer2", label: "Dashboard", end: true },
    { to: "/admin/faculty", icon: "bi-person-badge", label: "Manage Faculty" },
    { to: "/admin/students", icon: "bi-people", label: "Manage Students" },
    { to: "/admin/classes", icon: "bi-diagram-3", label: "Manage Classes" },
    { to: "/admin/reports", icon: "bi-bar-chart-line", label: "Reports & Analytics" },
  ];

  const facultyLinks = [
    { to: "/faculty", icon: "bi-speedometer2", label: "Dashboard", end: true },
    { to: "/faculty/mark", icon: "bi-check2-square", label: "Mark Attendance" },
    { to: "/faculty/history", icon: "bi-clock-history", label: "Attendance History" },
    { to: "/faculty/students", icon: "bi-people", label: "My Students" },
    { to: "/faculty/reports", icon: "bi-graph-up", label: "My Reports" },
  ];

  const links = isAdmin ? adminLinks : facultyLinks;

  return (
    <aside className="mis-sidebar">
      <div className="brand">
        <i className="bi bi-mortarboard-fill"></i>
        Attendance MIS
      </div>

      <div className="nav-section-label">{isAdmin ? "Admin Panel" : "Faculty Panel"}</div>
      <nav className="d-flex flex-column">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            <i className={`bi ${link.icon}`}></i>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer text-secondary small">
        Logged in as <strong className="text-white">{user?.fullName}</strong>
        <div className="mt-2">Developed by Indrajit Vankar &copy; 2026</div>
      </div>
    </aside>
  );
}

export default Sidebar;
