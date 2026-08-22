import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

function MyReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/api/faculty/reports")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="My Reports" subtitle={data ? `Class: ${data.class.name}` : ""}>
      <Alert message={error} onClose={() => setError(null)} />
      {loading ? (
        <Spinner label="Loading reports..." />
      ) : (
        data && (
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="mis-card p-4">
                <h6 className="fw-bold mb-3">7-Day Attendance Trend</h6>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="presentPct" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mis-card p-4">
                <h6 className="fw-bold mb-3">Per-Student Attendance %</h6>
                <div className="table-responsive" style={{ maxHeight: 320, overflowY: "auto" }}>
                  <table className="table mis-table align-middle mb-0">
                    <thead><tr><th>Roll No</th><th>Name</th><th className="text-end">Present %</th></tr></thead>
                    <tbody>
                      {data.perStudent.map((s) => (
                        <tr key={s.rollNo}>
                          <td>{s.rollNo}</td>
                          <td>{s.name}</td>
                          <td className="text-end fw-semibold">
                            <span style={{ color: s.presentPct >= 75 ? "#059669" : "#e11d48" }}>{s.presentPct}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </Layout>
  );
}

export default MyReports;
