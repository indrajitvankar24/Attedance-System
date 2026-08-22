import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/api/admin/reports/overview")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Reports & Analytics" subtitle="Institution-wide attendance insights">
      <Alert message={error} onClose={() => setError(null)} />
      {loading ? (
        <Spinner label="Loading reports..." />
      ) : (
        data && (
          <div className="row g-3">
            <div className="col-lg-7">
              <div className="mis-card p-4">
                <h6 className="fw-bold mb-3">7-Day Overall Attendance Trend</h6>
                <ResponsiveContainer width="100%" height={300}>
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
            <div className="col-lg-5">
              <div className="mis-card p-4">
                <h6 className="fw-bold mb-3">Class-wise Attendance (Today)</h6>
                {data.classWise.length === 0 ? (
                  <p className="text-muted small mb-0">No classes yet.</p>
                ) : (
                  <table className="table mis-table align-middle mb-0">
                    <thead><tr><th>Class</th><th className="text-end">Present %</th></tr></thead>
                    <tbody>
                      {data.classWise.map((c) => (
                        <tr key={c.className}>
                          <td>{c.className}</td>
                          <td className="text-end fw-semibold">{c.presentPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </Layout>
  );
}

export default Reports;
