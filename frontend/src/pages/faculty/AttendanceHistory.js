import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

function AttendanceHistory() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    apiClient
      .get("/api/faculty/attendance/dates")
      .then((res) => setDates(res.data.dates))
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load history." }))
      .finally(() => setLoadingDates(false));
  }, []);

  const loadDate = useCallback((date) => {
    setSelectedDate(date);
    setLoadingDetail(true);
    setAlert(null);
    apiClient
      .get(`/api/faculty/attendance?date=${date}`)
      .then((res) => {
        setStudents(res.data.attendance);
        const map = {};
        res.data.attendance.forEach((s) => { map[s.id] = s.status || "Present"; });
        setStatusMap(map);
      })
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load that date." }))
      .finally(() => setLoadingDetail(false));
  }, []);

  const handleToggle = (studentId, status) => setStatusMap((prev) => ({ ...prev, [studentId]: status }));

  const handleUpdate = async () => {
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
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to update attendance." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Attendance History" subtitle="View or correct attendance for a past date">
      <div className="row g-3">
        <div className="col-md-4">
          <div className="mis-card p-3">
            <h6 className="fw-bold mb-3">Marked Dates</h6>
            {loadingDates ? (
              <Spinner label="Loading dates..." />
            ) : dates.length === 0 ? (
              <p className="text-muted small mb-0">No attendance has been marked yet.</p>
            ) : (
              <div className="list-group">
                {dates.map((d) => (
                  <button
                    key={d}
                    className={`list-group-item list-group-item-action ${selectedDate === d ? "active" : ""}`}
                    style={selectedDate === d ? { background: "#4f46e5", borderColor: "#4f46e5" } : {}}
                    onClick={() => loadDate(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="mis-card p-4">
            <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

            {!selectedDate ? (
              <p className="text-muted mb-0">Select a date from the left to view or edit attendance.</p>
            ) : loadingDetail ? (
              <Spinner label="Loading attendance..." />
            ) : (
              <>
                <h6 className="fw-bold mb-3">Attendance for {selectedDate}</h6>
                <div className="table-responsive">
                  <table className="table mis-table align-middle">
                    <thead><tr><th>Roll No</th><th>Name</th><th>Status</th></tr></thead>
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
                <div className="d-flex justify-content-end">
                  <button className="btn btn-brand" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Updating..." : "Update Attendance"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AttendanceHistory;
