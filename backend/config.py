"""
Configuration for the Attendance MIS backend.
Change SECRET_KEY before deploying to production.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    # Used to sign JWT tokens - CHANGE THIS in production and keep it secret
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me-in-production")

    # SQLite database file lives next to this config file
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "mis.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT tokens expire after this many hours
    JWT_EXP_HOURS = 12
