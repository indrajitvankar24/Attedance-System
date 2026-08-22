"""
Admin-only routes (all require a valid JWT with role='admin').

Covers:
 - Faculty CRUD           /api/admin/faculty
 - Class CRUD             /api/admin/classes
 - Student CRUD           /api/admin/students
 - Reports & analytics    /api/admin/reports/overview
"""

from datetime import date, timedelta

from flask import Blueprint, request, jsonify, g

from extensions import db
from models import User, SchoolClass, Student, Attendance
from auth_utils import token_required, role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------------------------------------------------------------------------
# Faculty management
# ---------------------------------------------------------------------------
@admin_bp.route("/faculty", methods=["GET"])
@token_required
@role_required("admin")
def list_faculty():
    faculty = User.query.filter_by(role="faculty").order_by(User.full_name).all()
    return jsonify({"faculty": [f.to_dict() for f in faculty]}), 200


@admin_bp.route("/faculty", methods=["POST"])
@token_required
@role_required("admin")
def create_faculty():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("fullName") or "").strip()
    assigned_class_id = data.get("assignedClassId")

    if not username or not email or not password or not full_name:
        return jsonify({"error": "username, email, password and fullName are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "That username is already taken."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "That email is already registered."}), 409
    if assigned_class_id and not SchoolClass.query.get(assigned_class_id):
        return jsonify({"error": "Selected class does not exist."}), 400

    faculty = User(
        username=username, email=email, full_name=full_name,
        role="faculty", assigned_class_id=assigned_class_id,
    )
    faculty.set_password(password)
    db.session.add(faculty)
    db.session.commit()
    return jsonify({"faculty": faculty.to_dict()}), 201


@admin_bp.route("/faculty/<int:faculty_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_faculty(faculty_id):
    faculty = User.query.filter_by(id=faculty_id, role="faculty").first()
    if not faculty:
        return jsonify({"error": "Faculty member not found."}), 404

    data = request.get_json(silent=True) or {}
    if "fullName" in data and data["fullName"].strip():
        faculty.full_name = data["fullName"].strip()
    if "email" in data and data["email"].strip():
        existing = User.query.filter(User.email == data["email"], User.id != faculty_id).first()
        if existing:
            return jsonify({"error": "That email is already registered to another user."}), 409
        faculty.email = data["email"].strip()
    if "assignedClassId" in data:
        class_id = data["assignedClassId"]
        if class_id and not SchoolClass.query.get(class_id):
            return jsonify({"error": "Selected class does not exist."}), 400
        faculty.assigned_class_id = class_id
    if data.get("password"):
        if len(data["password"]) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400
        faculty.set_password(data["password"])

    db.session.commit()
    return jsonify({"faculty": faculty.to_dict()}), 200


@admin_bp.route("/faculty/<int:faculty_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_faculty(faculty_id):
    faculty = User.query.filter_by(id=faculty_id, role="faculty").first()
    if not faculty:
        return jsonify({"error": "Faculty member not found."}), 404
    db.session.delete(faculty)
    db.session.commit()
    return jsonify({"message": "Faculty member removed."}), 200


# ---------------------------------------------------------------------------
# Class management
# ---------------------------------------------------------------------------
@admin_bp.route("/classes", methods=["GET"])
@token_required
@role_required("admin")
def list_classes():
    classes = SchoolClass.query.order_by(SchoolClass.name).all()
    return jsonify({"classes": [c.to_dict() for c in classes]}), 200


@admin_bp.route("/classes", methods=["POST"])
@token_required
@role_required("admin")
def create_class():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Class name is required."}), 400
    if SchoolClass.query.filter_by(name=name).first():
        return jsonify({"error": "A class with that name already exists."}), 409

    school_class = SchoolClass(name=name)
    db.session.add(school_class)
    db.session.commit()
    return jsonify({"class": school_class.to_dict()}), 201


@admin_bp.route("/classes/<int:class_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_class(class_id):
    school_class = SchoolClass.query.get(class_id)
    if not school_class:
        return jsonify({"error": "Class not found."}), 404
    db.session.delete(school_class)  # cascades to students & their attendance
    db.session.commit()
    return jsonify({"message": "Class deleted."}), 200


# ---------------------------------------------------------------------------
# Student management
# ---------------------------------------------------------------------------
@admin_bp.route("/students", methods=["GET"])
@token_required
@role_required("admin")
def list_students():
    class_id = request.args.get("classId", type=int)
    query = Student.query
    if class_id:
        query = query.filter_by(class_id=class_id)
    students = query.order_by(Student.class_id, Student.roll_no).all()
    return jsonify({"students": [s.to_dict() for s in students]}), 200


@admin_bp.route("/students", methods=["POST"])
@token_required
@role_required("admin")
def create_student():
    data = request.get_json(silent=True) or {}
    roll_no = data.get("rollNo")
    name = (data.get("name") or "").strip()
    class_id = data.get("classId")

    if roll_no is None or not name or not class_id:
        return jsonify({"error": "rollNo, name and classId are required."}), 400
    if not SchoolClass.query.get(class_id):
        return jsonify({"error": "Selected class does not exist."}), 400
    if Student.query.filter_by(class_id=class_id, roll_no=roll_no).first():
        return jsonify({"error": "That roll number is already used in this class."}), 409

    student = Student(roll_no=roll_no, name=name, class_id=class_id)
    db.session.add(student)
    db.session.commit()
    return jsonify({"student": student.to_dict()}), 201


@admin_bp.route("/students/<int:student_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found."}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data and data["name"].strip():
        student.name = data["name"].strip()
    if "rollNo" in data:
        dup = Student.query.filter(
            Student.class_id == student.class_id,
            Student.roll_no == data["rollNo"],
            Student.id != student_id,
        ).first()
        if dup:
            return jsonify({"error": "That roll number is already used in this class."}), 409
        student.roll_no = data["rollNo"]
    if "classId" in data:
        if not SchoolClass.query.get(data["classId"]):
            return jsonify({"error": "Selected class does not exist."}), 400
        student.class_id = data["classId"]

    db.session.commit()
    return jsonify({"student": student.to_dict()}), 200


@admin_bp.route("/students/<int:student_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found."}), 404
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student removed."}), 200


# ---------------------------------------------------------------------------
# Reports & analytics
# ---------------------------------------------------------------------------
@admin_bp.route("/reports/overview", methods=["GET"])
@token_required
@role_required("admin")
def reports_overview():
    total_students = Student.query.count()
    total_faculty = User.query.filter_by(role="faculty").count()
    total_classes = SchoolClass.query.count()

    # Today's overall attendance %
    today = date.today()
    today_records = Attendance.query.filter_by(date=today).all()
    today_present = sum(1 for r in today_records if r.status == "Present")
    today_pct = round((today_present / len(today_records)) * 100, 1) if today_records else 0

    # Class-wise attendance % for today
    class_wise = []
    for school_class in SchoolClass.query.order_by(SchoolClass.name).all():
        records = [r for r in today_records if r.class_id == school_class.id]
        present = sum(1 for r in records if r.status == "Present")
        pct = round((present / len(records)) * 100, 1) if records else 0
        class_wise.append({"className": school_class.name, "presentPct": pct})

    # 7-day overall attendance trend
    trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_records = Attendance.query.filter_by(date=day).all()
        present = sum(1 for r in day_records if r.status == "Present")
        pct = round((present / len(day_records)) * 100, 1) if day_records else 0
        trend.append({"date": day.isoformat(), "presentPct": pct})

    return jsonify({
        "totalStudents": total_students,
        "totalFaculty": total_faculty,
        "totalClasses": total_classes,
        "todayAttendancePct": today_pct,
        "classWise": class_wise,
        "trend": trend,
    }), 200
