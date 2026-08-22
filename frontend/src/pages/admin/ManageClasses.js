import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchClasses = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/api/admin/classes")
      .then((res) => setClasses(res.data.classes))
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load classes." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchClasses, [fetchClasses]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      await apiClient.post("/api/admin/classes", { name });
      setName("");
      setAlert({ type: "success", message: "Class created successfully." });
      fetchClasses();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to create class." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, className) => {
    if (!window.confirm(`Delete "${className}"? This also removes its students and attendance records.`)) return;
    try {
      await apiClient.delete(`/api/admin/classes/${id}`);
      fetchClasses();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to delete class." });
    }
  };

  return (
    <Layout title="Manage Classes" subtitle="Create and organize classes/sections">
      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="mis-card p-4 mb-4">
        <h6 className="fw-bold mb-3">Add New Class</h6>
        <form className="row g-2 align-items-end" onSubmit={handleAdd}>
          <div className="col-sm-8 col-md-5">
            <label className="form-label">Class Name</label>
            <input
              className="form-control"
              placeholder="e.g. Grade 10 - B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="col-sm-4 col-md-3">
            <button className="btn btn-brand w-100" disabled={submitting}>
              {submitting ? "Adding..." : "Add Class"}
            </button>
          </div>
        </form>
      </div>

      <div className="mis-card p-4">
        {loading ? (
          <Spinner label="Loading classes..." />
        ) : classes.length === 0 ? (
          <p className="text-muted mb-0">No classes yet. Add one above.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mis-table align-middle">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Students</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.studentCount}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id, c.name)}>
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ManageClasses;
