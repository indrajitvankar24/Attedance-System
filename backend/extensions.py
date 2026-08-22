"""
Holds the shared SQLAlchemy() instance so it can be imported by both
app.py and models.py without creating a circular import.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
