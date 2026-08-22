"""
Authentication utilities:
 - generate_token(user)   -> creates a signed JWT containing user id + role
 - token_required          -> decorator: rejects request if no valid JWT
 - role_required(role)     -> decorator: rejects request if role doesn't match
"""

from functools import wraps
from datetime import datetime, timedelta

import jwt
from flask import request, jsonify, current_app, g

from models import User


def generate_token(user):
    """Create a signed JWT for the given User, valid for JWT_EXP_HOURS."""
    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=current_app.config["JWT_EXP_HOURS"]),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _get_token_from_header():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def token_required(f):
    """
    Decorator that verifies a valid JWT was sent in the Authorization header.
    On success, sets g.current_user to the corresponding User object.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = _get_token_from_header()
        if not token:
            return jsonify({"error": "Authentication token is missing."}), 401

        try:
            payload = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token."}), 401

        user = User.query.get(payload.get("user_id"))
        if not user:
            return jsonify({"error": "User not found."}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def role_required(required_role):
    """
    Decorator that must be used AFTER @token_required. Rejects the request
    with 403 if g.current_user's role doesn't match `required_role`.
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.current_user.role != required_role:
                return jsonify({
                    "error": f"Access denied. This action requires '{required_role}' role."
                }), 403
            return f(*args, **kwargs)

        return decorated

    return decorator
