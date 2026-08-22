import React from "react";

export function Alert({ type = "danger", message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      )}
    </div>
  );
}

export function StatCard({ icon, iconBg, iconColor, value, label }) {
  return (
    <div className="stat-card d-flex align-items-center gap-3">
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-brand" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
      <p className="text-muted mt-2">{label}</p>
    </div>
  );
}
