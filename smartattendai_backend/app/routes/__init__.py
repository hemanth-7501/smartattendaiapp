from app.routes.auth import auth_bp
from app.routes.attendance import attendance_bp
from app.routes.user import user_bp
from app.routes.parent import parent_bp
from app.routes.report import report_bp
from app.routes.student import student_bp

__all__ = [
    "auth_bp",
    "attendance_bp",
    "user_bp",
    "parent_bp",
    "report_bp",
    "student_bp",
]
