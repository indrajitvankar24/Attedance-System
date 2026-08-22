import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

const emptyForm = { id: null, fullName: "", username: "", email: "", password: "", assignedClassId: "" };

function ManageFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/api/admin/faculty"),
      apiClient.get("/api/admin/classes"),
    ])
      .then(([facultyRes, classesRes]) => {
        setFaculty(facultyRes.data.faculty);
        setClasses(classesRes.data.classes);
      })
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load data." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchAll, [fetchAll]);

  const openAddForm = () => { setForm(emptyForm); setShowForm(true); };
  const openEditForm = (f) => {
    setForm({ id: f.id, fullName: f.fullName, username: f.username, email: f.email, password: "", assignedClassId: f.assignedClassId || "" });
    setShowForm(true);
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    const payload = {
      fullName: form.fullName, email: form.email,
      assignedClassId: form.assignedClassId || null,
    };
    try {
      if (form.id) {
        if (form.password) payload.password = form.password;
        await apiClient.put(`/api/admin/faculty/${form.id}`, payload);
        setAlert({ type: "success", message: "Faculty updated successfully." });
      } else {
        payload.username = form.username;
        payload.password = form.password;
        await apiClient.post("/api/admin/faculty", payload);
        setAlert({ type: "success", message: "Faculty account created successfully." });
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to save faculty." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove faculty account "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/admin/faculty/${id}`);
      fetchAll();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to delete faculty." });
    }
  };

  return (
    <Layout title="Manage Faculty" subtitle="Add faculty accounts and assign them to classes">
      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-brand" onClick={openAddForm}>
          <i className="bi bi-plus-lg me-1"></i> Add Faculty
        </button>
      </div>

      {showForm && (
        <div className="mis-card p-4 mb-4">
          <h6 className="fw-bold mb-3">{form.id ? "Edit Faculty" : "New Faculty Account"}</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input name="fullName" className="form-control" value={form.fullName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
              {!form.id && (
                <div className="col-md-6">
                  <label className="form-label">Username</label>
                  <input name="username" className="form-control" value={form.username} onChange={handleChange} required />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label">{form.id ? "New Password (optional)" : "Password"}</label>
                <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required={!form.id} minLength={6} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Assigned Class</label>
                <select name="assignedClassId" className="form-select" value={form.assignedClassId} onChange={handleChange}>
                  <option value="">-- None --</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-brand" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mis-card p-4">
        {loading ? (
          <Spinner label="Loading faculty..." />
        ) : faculty.length === 0 ? (
          <p className="text-muted mb-0">No faculty accounts yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mis-table align-middle">
              <thead>
                <tr>
                  <th>Name</th><th>Username</th><th>Email</th><th>Assigned Class</th><th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.id}>
                    <td className="fw-semibold">{f.fullName}</td>
                    <td>{f.username}</td>
                    <td>{f.email}</td>
                    <td>{f.assignedClassName || <span className="text-muted">Unassigned</span>}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-brand me-2" onClick={() => openEditForm(f)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id, f.fullName)}>
                        <i className="bi bi-trash"></i>
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

export default ManageFaculty;
