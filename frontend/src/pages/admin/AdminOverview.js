import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { StatCard, Spinner, Alert } from "../../components/Common";

function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/api/admin/reports/overview")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Admin Dashboard" subtitle="Overview of your institution">
      <Alert message={error} onClose={() => setError(null)} />
      {loading ? (
        <Spinner label="Loading dashboard..." />
      ) : (
        data && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <StatCard icon="bi-people" iconBg="#eef2ff" iconColor="#4f46e5" value={data.totalStudents} label="Total Students" />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard icon="bi-person-badge" iconBg="#ecfdf5" iconColor="#059669" value={data.totalFaculty} label="Total Faculty" />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard icon="bi-diagram-3" iconBg="#fff7ed" iconColor="#ea580c" value={data.totalClasses} label="Total Classes" />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard icon="bi-check2-circle" iconBg="#fff1f2" iconColor="#e11d48" value={`${data.todayAttendancePct}%`} label="Today's Attendance" />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-lg-6">
                <div className="mis-card p-4 h-100">
                  <h6 className="fw-bold mb-3">Class-wise Attendance Today</h6>
                  {data.classWise.length === 0 ? (
                    <p className="text-muted small mb-0">No classes yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.classWise}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="presentPct" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="mis-card p-4 h-100">
                  <h6 className="fw-bold mb-3">7-Day Attendance Trend</h6>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="presentPct" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </Layout>
  );
}

export default AdminOverview;
