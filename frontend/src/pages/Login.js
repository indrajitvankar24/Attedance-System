import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Common";

function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await login(username, password);
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
          <i className="bi bi-mortarboard-fill text-brand" style={{ fontSize: "2.2rem" }}></i>
          <h4 className="fw-bold mt-2 mb-0">Attendance MIS</h4>
          <p className="text-muted small">Sign in to your account</p>
        </div>

        <Alert message={error} onClose={() => setError(null)} />

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-brand w-100" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account? <Link to="/signup" className="text-brand fw-semibold">Sign up</Link>
        </p>

        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small mb-1"><strong>Demo credentials:</strong></p>
          <p className="text-muted small mb-0">Admin &mdash; admin / admin123</p>
          <p className="text-muted small mb-0">Faculty &mdash; faculty1 / faculty123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
