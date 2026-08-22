"""
Database models for the Attendance MIS.

Entities
--------
User          -> Admin or Faculty account (login credentials + role)
SchoolClass   -> A class/section, e.g. "Grade 10 - A"
Student       -> Belongs to one SchoolClass
Attendance    -> One row per (student, date), status = Present/Absent
"""

from datetime import datetime, date as date_cls
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class SchoolClass(db.Model):
    __tablename__ = "school_class"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)  # e.g. "Grade 10 - A"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    students = db.relationship(
        "Student", backref="school_class", cascade="all, delete-orphan", lazy=True
    )
    faculty_members = db.relationship("User", backref="assigned_class", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "studentCount": len(self.students),
        }


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="faculty")  # 'admin' | 'faculty'

    # Only relevant for faculty accounts - which class they teach/manage
    assigned_class_id = db.Column(
        db.Integer, db.ForeignKey("school_class.id"), nullable=True
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "fullName": self.full_name,
            "role": self.role,
            "assignedClassId": self.assigned_class_id,
            "assignedClassName": self.assigned_class.name if self.assigned_class else None,
        }


class Student(db.Model):
    __tablename__ = "student"
    __table_args__ = (
        db.UniqueConstraint("class_id", "roll_no", name="unique_roll_per_class"),
    )

    id = db.Column(db.Integer, primary_key=True)
    roll_no = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("school_class.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    attendance_records = db.relationship(
        "Attendance", backref="student", cascade="all, delete-orphan", lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "rollNo": self.roll_no,
            "name": self.name,
            "classId": self.class_id,
            "className": self.school_class.name if self.school_class else None,
        }


class Attendance(db.Model):
    __tablename__ = "attendance"
    __table_args__ = (
        db.UniqueConstraint("student_id", "date", name="unique_attendance_per_day"),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("school_class.id"), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date_cls.today)
    status = db.Column(db.String(10), nullable=False)  # 'Present' | 'Absent'
    marked_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "studentId": self.student_id,
            "classId": self.class_id,
            "date": self.date.isoformat(),
            "status": self.status,
        }
