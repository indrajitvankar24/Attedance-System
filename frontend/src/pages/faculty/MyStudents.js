import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

const emptyForm = { id: null, rollNo: "", name: "" };

function MyStudents() {
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/api/faculty/students")
      .then((res) => {
        setClassName(res.data.class.name);
        setStudents(res.data.students);
      })
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load students." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchStudents, [fetchStudents]);

  const openAddForm = () => { setForm(emptyForm); setShowForm(true); };
  const openEditForm = (s) => { setForm({ id: s.id, rollNo: s.rollNo, name: s.name }); setShowForm(true); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    const payload = { rollNo: Number(form.rollNo), name: form.name };
    try {
      if (form.id) {
        await apiClient.put(`/api/faculty/students/${form.id}`, payload);
        setAlert({ type: "success", message: "Student updated." });
      } else {
        await apiClient.post("/api/faculty/students", payload);
        setAlert({ type: "success", message: "Student added." });
      }
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to save student." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from your class?`)) return;
    try {
      await apiClient.delete(`/api/faculty/students/${id}`);
      fetchStudents();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to delete student." });
    }
  };

  return (
    <Layout title="My Students" subtitle={className ? `Class: ${className}` : ""}>
      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-brand" onClick={openAddForm}>
          <i className="bi bi-plus-lg me-1"></i> Add Student
        </button>
      </div>

      {showForm && (
        <div className="mis-card p-4 mb-4">
          <h6 className="fw-bold mb-3">{form.id ? "Edit Student" : "New Student"}</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Roll No</label>
                <input type="number" name="rollNo" className="form-control" value={form.rollNo} onChange={handleChange} required />
              </div>
              <div className="col-md-8">
                <label className="form-label">Student Name</label>
                <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-brand" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mis-card p-4">
        {loading ? (
          <Spinner label="Loading students..." />
        ) : students.length === 0 ? (
          <p className="text-muted mb-0">No students yet. Add one above.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mis-table align-middle">
              <thead><tr><th>Roll No</th><th>Name</th><th className="text-end">Action</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.rollNo}</td>
                    <td className="fw-semibold">{s.name}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-brand me-2" onClick={() => openEditForm(s)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id, s.name)}><i className="bi bi-trash"></i></button>
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

export default MyStudents;
