import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route element. Redirects to /login if not authenticated,
 * or to the correct dashboard if the user's role doesn't match
 * `allowedRole` (e.g. a faculty user trying to open an admin page).
 */
function ProtectedRoute({ allowedRole, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    const fallback = user.role === "admin" ? "/admin" : "/faculty";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default ProtectedRoute;
