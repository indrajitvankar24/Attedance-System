"""
Authentication routes: /api/auth/signup, /api/auth/login, /api/auth/me
"""

from flask import Blueprint, request, jsonify, g

from extensions import db
from models import User, SchoolClass
from auth_utils import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Creates a new account. In a real production MIS you'd usually restrict
    faculty creation to admins only (see /api/admin/faculty for that flow).
    This public signup is kept simple so the app is easy to demo - it lets
    you register either as 'admin' or 'faculty'.
    """
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("fullName") or "").strip()
    role = data.get("role") or "faculty"
    assigned_class_id = data.get("assignedClassId")

    # ---- Validation ----
    if not username or not email or not password or not full_name:
        return jsonify({"error": "username, email, password and fullName are required."}), 400
    if role not in ("admin", "faculty"):
        return jsonify({"error": "role must be 'admin' or 'faculty'."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "That username is already taken."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "That email is already registered."}), 409

    if role == "faculty" and assigned_class_id:
        if not SchoolClass.query.get(assigned_class_id):
            return jsonify({"error": "Selected class does not exist."}), 400

    # ---- Create user ----
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        role=role,
        assigned_class_id=assigned_class_id if role == "faculty" else None,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required."}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    """Returns the currently authenticated user's profile."""
    return jsonify({"user": g.current_user.to_dict()}), 200
