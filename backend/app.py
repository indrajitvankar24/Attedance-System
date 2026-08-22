"""
Attendance MIS - Backend Entry Point
=====================================
Run with:
    python app.py

Starts the API on http://localhost:5000 and creates mis.db (SQLite) with
demo data on first run:
    Admin login    -> username: admin     password: admin123
    Faculty login  -> username: faculty1  password: faculty123 (Class: Grade 10 - A)
"""

from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db
from models import User, SchoolClass, Student

from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.faculty_routes import faculty_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow the React dev server to call this API from a different origin.
    # In production, restrict origins to your actual frontend domain.
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(faculty_bp)

    with app.app_context():
        db.create_all()
        seed_demo_data()

    return app


def seed_demo_data():
    """
    Populates the database with a demo admin, a demo class, a demo faculty
    account, and a handful of students - but ONLY if the database is empty.
    This makes the app immediately usable after `python app.py` without any
    manual signup step.
    """
    if User.query.first():
        return  # already seeded / real data exists

    # --- Demo class ---
    demo_class = SchoolClass(name="Grade 10 - A")
    db.session.add(demo_class)
    db.session.flush()  # so demo_class.id is available below

    # --- Demo admin account ---
    admin = User(
        username="admin",
        email="admin@school.com",
        full_name="System Administrator",
        role="admin",
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # --- Demo faculty account, assigned to the demo class ---
    faculty = User(
        username="faculty1",
        email="faculty1@school.com",
        full_name="Mrs. Priya Sharma",
        role="faculty",
        assigned_class_id=demo_class.id,
    )
    faculty.set_password("faculty123")
    db.session.add(faculty)

    # --- Demo students in that class ---
    demo_students = [
        (1, "Aarav Sharma"), (2, "Vivaan Patel"), (3, "Aditya Reddy"),
        (4, "Ishaan Gupta"), (5, "Sai Krishnan"), (6, "Ananya Iyer"),
        (7, "Diya Mehta"), (8, "Saanvi Nair"), (9, "Myra Joshi"),
        (10, "Kabir Malhotra"),
    ]
    for roll_no, name in demo_students:
        db.session.add(Student(roll_no=roll_no, name=name, class_id=demo_class.id))

    db.session.commit()
    print("Seeded demo data: admin/admin123, faculty1/faculty123")


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
