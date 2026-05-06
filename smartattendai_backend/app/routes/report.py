from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Attendance, Student, ParentStudentMapping, User
from datetime import datetime

report_bp = Blueprint('reports', __name__)

@report_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def student_report(student_id):
    """Generate a student attendance report"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role not in ['teacher', 'hod', 'parent']:
        return jsonify({'error': 'Unauthorized'}), 403

    if user.role == 'parent':
        mapping = ParentStudentMapping.query.filter_by(parent_id=user_id, student_id=student_id).first()
        if not mapping:
            return jsonify({'error': 'Unauthorized to view this student'}), 403

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400

    try:
        start_date = datetime.fromisoformat(start_date).date()
        end_date = datetime.fromisoformat(end_date).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    attendances = Attendance.query.filter(
        Attendance.student_id == student_id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).all()

    total_days = len(attendances)
    present_days = len([a for a in attendances if a.status == 'present'])
    absent_days = len([a for a in attendances if a.status == 'absent'])
    late_days = len([a for a in attendances if a.status == 'late'])
    attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0

    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    return jsonify({
        'student': student.to_dict(),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'summary': {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'attendance_percentage': round(attendance_percentage, 2)
        },
        'attendances': [a.to_dict() for a in attendances]
    }), 200

@report_bp.route('/class', methods=['GET'])
@jwt_required()
def class_report():
    """Generate attendance report for a class or section"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role not in ['teacher', 'hod']:
        return jsonify({'error': 'Unauthorized'}), 403

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    grade = request.args.get('grade')
    section = request.args.get('section')

    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400

    try:
        start_date = datetime.fromisoformat(start_date).date()
        end_date = datetime.fromisoformat(end_date).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    student_query = Student.query.filter_by(is_active=True)
    if grade:
        student_query = student_query.filter_by(grade=grade)
    if section:
        student_query = student_query.filter_by(section=section)

    students = student_query.all()
    data = []

    for student in students:
        attendances = Attendance.query.filter(
            Attendance.student_id == student.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).all()

        total_days = len(attendances)
        present_days = len([a for a in attendances if a.status == 'present'])
        attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0

        data.append({
            'student': student.to_dict(),
            'summary': {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': len([a for a in attendances if a.status == 'absent']),
                'late_days': len([a for a in attendances if a.status == 'late']),
                'attendance_percentage': round(attendance_percentage, 2)
            }
        })

    return jsonify({
        'filters': {
            'grade': grade,
            'section': section,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'data': data,
        'total_students': len(data)
    }), 200
