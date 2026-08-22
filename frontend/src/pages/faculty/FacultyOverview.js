import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { StatCard, Spinner, Alert } from "../../components/Common";

function FacultyOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/api/faculty/reports")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const avgPct = data?.perStudent?.length
    ? Math.round(data.perStudent.reduce((sum, s) => sum + s.presentPct, 0) / data.perStudent.length)
    : 0;

  return (
    <Layout title="Faculty Dashboard" subtitle={data ? `Class: ${data.class.name}` : ""}>
      <Alert message={error} onClose={() => setError(null)} />
      {loading ? (
        <Spinner label="Loading dashboard..." />
      ) : (
        data && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-4">
                <StatCard icon="bi-people" iconBg="#eef2ff" iconColor="#4f46e5" value={data.perStudent.length} label="Students in Class" />
              </div>
              <div className="col-6 col-lg-4">
                <StatCard icon="bi-graph-up" iconBg="#ecfdf5" iconColor="#059669" value={`${avgPct}%`} label="Avg. Attendance" />
              </div>
              <div className="col-6 col-lg-4">
                <StatCard icon="bi-calendar-check" iconBg="#fff7ed" iconColor="#ea580c" value={data.trend.at(-1)?.presentPct + "%"} label="Today's Attendance" />
              </div>
            </div>

            <div className="d-flex gap-2">
              <Link to="/faculty/mark" className="btn btn-brand">
                <i className="bi bi-check2-square me-1"></i> Mark Today's Attendance
              </Link>
              <Link to="/faculty/reports" className="btn btn-outline-brand">
                <i className="bi bi-graph-up me-1"></i> View Full Reports
              </Link>
            </div>
          </>
        )
      )}
    </Layout>
  );
}

export default FacultyOverview;
