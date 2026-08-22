import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Common";

function Signup() {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", password: "", role: "faculty",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await signup(form);
    if (result.success) {
      navigate(result.user.role === "admin" ? "/admin" : "/faculty");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-brand" style={{ fontSize: "2.2rem" }}></i>
          <h4 className="fw-bold mt-2 mb-0">Create Account</h4>
          <p className="text-muted small">Join the Attendance MIS</p>
        </div>

        <Alert message={error} onClose={() => setError(null)} />

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input name="fullName" className="form-control" value={form.fullName} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input name="username" className="form-control" value={form.username} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="mb-4">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange}>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <div className="form-text">
              {form.role === "faculty"
                ? "An admin can assign you to a class after signup."
                : "Admins can manage faculty, students, classes and reports."}
            </div>
          </div>
          <button type="submit" className="btn btn-brand w-100" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account? <Link to="/login" className="text-brand fw-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
