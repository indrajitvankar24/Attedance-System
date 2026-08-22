import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AdminOverview from "./pages/admin/AdminOverview";
import ManageFaculty from "./pages/admin/ManageFaculty";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageClasses from "./pages/admin/ManageClasses";
import Reports from "./pages/admin/Reports";

import FacultyOverview from "./pages/faculty/FacultyOverview";
import MarkAttendance from "./pages/faculty/MarkAttendance";
import AttendanceHistory from "./pages/faculty/AttendanceHistory";
import MyStudents from "./pages/faculty/MyStudents";
import MyReports from "./pages/faculty/MyReports";

/** Redirects "/" to the right dashboard (or login if not authenticated). */
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/faculty"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin panel */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminOverview /></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute allowedRole="admin"><ManageFaculty /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><ManageStudents /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRole="admin"><ManageClasses /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><Reports /></ProtectedRoute>} />

      {/* Faculty panel */}
      <Route path="/faculty" element={<ProtectedRoute allowedRole="faculty"><FacultyOverview /></ProtectedRoute>} />
      <Route path="/faculty/mark" element={<ProtectedRoute allowedRole="faculty"><MarkAttendance /></ProtectedRoute>} />
      <Route path="/faculty/history" element={<ProtectedRoute allowedRole="faculty"><AttendanceHistory /></ProtectedRoute>} />
      <Route path="/faculty/students" element={<ProtectedRoute allowedRole="faculty"><MyStudents /></ProtectedRoute>} />
      <Route path="/faculty/reports" element={<ProtectedRoute allowedRole="faculty"><MyReports /></ProtectedRoute>} />

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
