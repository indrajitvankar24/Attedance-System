import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

function getTodayDateString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function MarkAttendance() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchAttendance = useCallback((date) => {
    setLoading(true);
    setAlert(null);
    apiClient
      .get(`/api/faculty/attendance?date=${date}`)
      .then((res) => {
        setStudents(res.data.attendance);
        const map = {};
        res.data.attendance.forEach((s) => {
          map[s.id] = s.status || "Present"; // default to Present if not yet marked
        });
        setStatusMap(map);
      })
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load students." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAttendance(selectedDate); }, [selectedDate, fetchAttendance]);

  const handleToggle = (studentId, status) => setStatusMap((prev) => ({ ...prev, [studentId]: status }));

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const payload = {
        date: selectedDate,
        attendance: students.map((s) => ({ studentId: s.id, status: statusMap[s.id] || "Present" })),
      };
      const res = await apiClient.post("/api/faculty/attendance", payload);
      setAlert({ type: "success", message: res.data.message });
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to save attendance." });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(statusMap).filter((s) => s === "Present").length;
  const absentCount = Object.values(statusMap).filter((s) => s === "Absent").length;

  return (
    <Layout title="Mark Attendance" subtitle="Toggle status for each student and save">
      <div className="mis-card p-4">
        <div className="row mb-4">
          <div className="col-12 col-md-4">
            <label className="form-label">Attendance Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              max={getTodayDateString()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

        {loading ? (
          <Spinner label="Loading students..." />
        ) : students.length === 0 ? (
          <p className="text-muted">No students in your class yet. Add some under "My Students".</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table mis-table align-middle">
                <thead><tr><th>Roll No</th><th>Student Name</th><th>Action</th></tr></thead>
                <tbody>
                  {students.map((s) => {
                    const status = statusMap[s.id] || "Present";
                    return (
                      <tr key={s.id}>
                        <td>{s.rollNo}</td>
                        <td>{s.name}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className={`btn btn-sm btn-status-present ${status === "Present" ? "active-status" : ""}`}
                              onClick={() => handleToggle(s.id, "Present")}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm btn-status-absent ${status === "Absent" ? "active-status" : ""}`}
                              onClick={() => handleToggle(s.id, "Absent")}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex gap-3 mb-4 mt-2">
              <span className="badge" style={{ background: "#ecfdf5", color: "#059669" }}>Present: {presentCount}</span>
              <span className="badge" style={{ background: "#fff1f2", color: "#e11d48" }}>Absent: {absentCount}</span>
            </div>

            <div className="d-grid d-md-flex justify-content-md-end">
              <button className="btn btn-brand px-4" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : "Save Attendance"}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default MarkAttendance;
