<<<<<<< HEAD
# Attedance-System
=======
# Attendance MIS — Admin & Faculty Panel

Full-stack Attendance Management System with **JWT authentication**, **role-based
Admin/Faculty panels**, a **SQLite database**, and a modern sidebar dashboard UI
(React + Bootstrap 5 + Recharts).

## Folder Structure
```
attendance-mis/
├── backend/
│   ├── app.py               # Entry point, seeds demo data on first run
│   ├── config.py
│   ├── extensions.py
│   ├── models.py             # User, SchoolClass, Student, Attendance
│   ├── auth_utils.py         # JWT create/verify + role_required decorator
│   ├── routes/
│   │   ├── auth_routes.py    # /api/auth/*
│   │   ├── admin_routes.py   # /api/admin/*
│   │   └── faculty_routes.py # /api/faculty/*
│   └── requirements.txt
│
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── api/client.js         # Axios instance, auto-attaches JWT
        ├── context/AuthContext.js
        ├── components/           # Sidebar, Layout, ProtectedRoute, Common
        ├── pages/Login.js, Signup.js
        ├── pages/admin/           # Dashboard, Faculty, Students, Classes, Reports
        └── pages/faculty/         # Dashboard, Mark, History, Students, Reports
```

## 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs at **http://localhost:5000**. On first run it creates `mis.db` (SQLite)
and seeds demo accounts + a sample class:

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Faculty | faculty1  | faculty123  |

## 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Opens at **http://localhost:3000**.

## 3. How It Works

**Admin panel** (`/admin`)
- Dashboard: total students/faculty/classes, today's attendance %, class-wise bar chart, 7-day trend line chart
- Manage Faculty: create/edit/delete faculty accounts, assign each to a class
- Manage Students: create/edit/delete students, filter by class
- Manage Classes: create/delete classes
- Attendance History: pick any past date from a list, view and correct it
- My Students: add/edit/remove students in their own class
  instead — but this is enabled for easy demoing per your requirements).
- JWT is stored in `localStorage` and attached to every API call automatically.
  one via **Manage Faculty → Edit** before that faculty member can mark attendance.

The original version used an `.xlsx` file, which works for a single flat
attendance sheet. Once you add logins, roles, multiple classes, and reports,
you need real relational data (users ↔ classes ↔ students ↔ attendance) —
Excel can't enforce that cleanly. SQLite keeps things simple (still just one
file, `mis.db`, no separate DB server to install) while properly supporting
all of this.

## 5. Production Notes
- Change `SECRET_KEY` in `backend/config.py`.
- Restrict CORS `origins` to your real frontend domain.
- Set `debug=False` in `app.py`.
- Consider disabling public admin signup and only allowing admins to create

