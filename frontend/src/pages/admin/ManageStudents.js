import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/client";
import Layout from "../../components/Layout";
import { Alert, Spinner } from "../../components/Common";

const emptyForm = { id: null, rollNo: "", name: "", classId: "" };

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClassId, setFilterClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const studentsUrl = filterClassId
      ? `/api/admin/students?classId=${filterClassId}`
      : "/api/admin/students";
    Promise.all([apiClient.get(studentsUrl), apiClient.get("/api/admin/classes")])
      .then(([studentsRes, classesRes]) => {
        setStudents(studentsRes.data.students);
        setClasses(classesRes.data.classes);
      })
      .catch((err) => setAlert({ type: "danger", message: err.response?.data?.error || "Failed to load data." }))
      .finally(() => setLoading(false));
  }, [filterClassId]);

  useEffect(fetchAll, [fetchAll]);

  const openAddForm = () => { setForm(emptyForm); setShowForm(true); };
  const openEditForm = (s) => { setForm({ id: s.id, rollNo: s.rollNo, name: s.name, classId: s.classId }); setShowForm(true); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    const payload = { rollNo: Number(form.rollNo), name: form.name, classId: Number(form.classId) };
    try {
      if (form.id) {
        await apiClient.put(`/api/admin/students/${form.id}`, payload);
        setAlert({ type: "success", message: "Student updated successfully." });
      } else {
        await apiClient.post("/api/admin/students", payload);
        setAlert({ type: "success", message: "Student added successfully." });
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to save student." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove student "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/admin/students/${id}`);
      fetchAll();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Failed to delete student." });
    }
  };

  return (
    <Layout title="Manage Students" subtitle="Add students and assign them to classes">
      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
        <select className="form-select" style={{ maxWidth: 260 }} value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-brand" onClick={openAddForm}>
          <i className="bi bi-plus-lg me-1"></i> Add Student
        </button>
      </div>

      {showForm && (
        <div className="mis-card p-4 mb-4">
          <h6 className="fw-bold mb-3">{form.id ? "Edit Student" : "New Student"}</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Roll No</label>
                <input type="number" name="rollNo" className="form-control" value={form.rollNo} onChange={handleChange} required />
              </div>
              <div className="col-md-5">
                <label className="form-label">Student Name</label>
                <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Class</label>
                <select name="classId" className="form-select" value={form.classId} onChange={handleChange} required>
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
          <p className="text-muted mb-0">No students found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mis-table align-middle">
              <thead>
                <tr><th>Roll No</th><th>Name</th><th>Class</th><th className="text-end">Action</th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.rollNo}</td>
                    <td className="fw-semibold">{s.name}</td>
                    <td>{s.className}</td>
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

export default ManageStudents;
