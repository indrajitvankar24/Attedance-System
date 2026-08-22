"""
Faculty-only routes (all require a valid JWT with role='faculty').
A faculty account is scoped to exactly one SchoolClass via
user.assigned_class_id - every route here only ever touches that class.

Covers:
 - Own-class student CRUD     /api/faculty/students
 - Mark / update attendance   /api/faculty/attendance
 - Attendance history         /api/faculty/attendance/dates
 - Reports for own class      /api/faculty/reports
"""

from datetime import datetime, date as date_cls, timedelta

from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Student, Attendance, SchoolClass
from auth_utils import token_required, role_required

faculty_bp = Blueprint("faculty", __name__, url_prefix="/api/faculty")


def _require_assigned_class():
    """
    Returns the faculty's assigned SchoolClass, or None (with an error
    already suitable to return) if they have no class assigned yet.
    """
    class_id = g.current_user.assigned_class_id
    if not class_id:
        return None
    return SchoolClass.query.get(class_id)


# ---------------------------------------------------------------------------
# Own-class student management
# ---------------------------------------------------------------------------
@faculty_bp.route("/students", methods=["GET"])
@token_required
@role_required("faculty")
def list_my_students():
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    students = Student.query.filter_by(class_id=school_class.id).order_by(Student.roll_no).all()
    return jsonify({
        "class": school_class.to_dict(),
        "students": [s.to_dict() for s in students],
    }), 200


@faculty_bp.route("/students", methods=["POST"])
@token_required
@role_required("faculty")
def add_my_student():
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    data = request.get_json(silent=True) or {}
    roll_no = data.get("rollNo")
    name = (data.get("name") or "").strip()

    if roll_no is None or not name:
        return jsonify({"error": "rollNo and name are required."}), 400
    if Student.query.filter_by(class_id=school_class.id, roll_no=roll_no).first():
        return jsonify({"error": "That roll number is already used in your class."}), 409

    student = Student(roll_no=roll_no, name=name, class_id=school_class.id)
    db.session.add(student)
    db.session.commit()
    return jsonify({"student": student.to_dict()}), 201


@faculty_bp.route("/students/<int:student_id>", methods=["PUT"])
@token_required
@role_required("faculty")
def update_my_student(student_id):
    school_class = _require_assigned_class()
    student = Student.query.filter_by(id=student_id, class_id=school_class.id if school_class else -1).first()
    if not student:
        return jsonify({"error": "Student not found in your class."}), 404

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
            return jsonify({"error": "That roll number is already used in your class."}), 409
        student.roll_no = data["rollNo"]

    db.session.commit()
    return jsonify({"student": student.to_dict()}), 200


@faculty_bp.route("/students/<int:student_id>", methods=["DELETE"])
@token_required
@role_required("faculty")
def delete_my_student(student_id):
    school_class = _require_assigned_class()
    student = Student.query.filter_by(id=student_id, class_id=school_class.id if school_class else -1).first()
    if not student:
        return jsonify({"error": "Student not found in your class."}), 404
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student removed."}), 200


# ---------------------------------------------------------------------------
# Mark / view attendance for a specific date
# ---------------------------------------------------------------------------
@faculty_bp.route("/attendance", methods=["GET"])
@token_required
@role_required("faculty")
def get_attendance_for_date():
    """
    Query param: ?date=YYYY-MM-DD
    Returns every student in the faculty's class along with their status
    for that date (null if not yet marked).
    """
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "date query parameter is required (YYYY-MM-DD)."}), 400
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be in YYYY-MM-DD format."}), 400

    students = Student.query.filter_by(class_id=school_class.id).order_by(Student.roll_no).all()
    records = {
        r.student_id: r.status
        for r in Attendance.query.filter_by(class_id=school_class.id, date=target_date).all()
    }

    result = [
        {
            "id": s.id,
            "rollNo": s.roll_no,
            "name": s.name,
            "status": records.get(s.id),  # None if not marked yet
        }
        for s in students
    ]
    return jsonify({"date": date_str, "attendance": result}), 200


@faculty_bp.route("/attendance", methods=["POST"])
@token_required
@role_required("faculty")
def save_attendance():
    """
    Body: { "date": "YYYY-MM-DD", "attendance": [{ "studentId": 1, "status": "Present" }, ...] }
    Upserts one Attendance row per student for that date.
    """
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    data = request.get_json(silent=True) or {}
    date_str = data.get("date")
    records = data.get("attendance")

    if not date_str:
        return jsonify({"error": "date is required."}), 400
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be in YYYY-MM-DD format."}), 400
    if not records or not isinstance(records, list):
        return jsonify({"error": "attendance must be a non-empty list."}), 400

    for record in records:
        if "studentId" not in record or record.get("status") not in ("Present", "Absent"):
            return jsonify({"error": "Each record needs studentId and a valid status."}), 400

        student = Student.query.filter_by(
            id=record["studentId"], class_id=school_class.id
        ).first()
        if not student:
            continue  # skip students that don't belong to this class

        existing = Attendance.query.filter_by(student_id=student.id, date=target_date).first()
        if existing:
            existing.status = record["status"]
            existing.marked_by = g.current_user.id
        else:
            db.session.add(Attendance(
                student_id=student.id,
                class_id=school_class.id,
                date=target_date,
                status=record["status"],
                marked_by=g.current_user.id,
            ))

    db.session.commit()
    return jsonify({
        "message": f"Attendance for {date_str} saved successfully.",
        "recordsSaved": len(records),
    }), 200


@faculty_bp.route("/attendance/dates", methods=["GET"])
@token_required
@role_required("faculty")
def list_marked_dates():
    """Returns the distinct dates that already have attendance marked, newest first."""
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    rows = (
        db.session.query(Attendance.date)
        .filter_by(class_id=school_class.id)
        .distinct()
        .order_by(Attendance.date.desc())
        .all()
    )
    return jsonify({"dates": [r[0].isoformat() for r in rows]}), 200


# ---------------------------------------------------------------------------
# Reports for own class
# ---------------------------------------------------------------------------
@faculty_bp.route("/reports", methods=["GET"])
@token_required
@role_required("faculty")
def my_class_reports():
    school_class = _require_assigned_class()
    if not school_class:
        return jsonify({"error": "No class is assigned to your account yet. Contact admin."}), 400

    students = Student.query.filter_by(class_id=school_class.id).order_by(Student.roll_no).all()

    # Per-student attendance %
    per_student = []
    for s in students:
        records = Attendance.query.filter_by(student_id=s.id).all()
        present = sum(1 for r in records if r.status == "Present")
        pct = round((present / len(records)) * 100, 1) if records else 0
        per_student.append({
            "rollNo": s.roll_no, "name": s.name,
            "presentPct": pct, "totalMarkedDays": len(records),
        })

    # 7-day trend for this class
    today = date_cls.today()
    trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_records = Attendance.query.filter_by(class_id=school_class.id, date=day).all()
        present = sum(1 for r in day_records if r.status == "Present")
        pct = round((present / len(day_records)) * 100, 1) if day_records else 0
        trend.append({"date": day.isoformat(), "presentPct": pct})

    return jsonify({
        "class": school_class.to_dict(),
        "perStudent": per_student,
        "trend": trend,
    }), 200
