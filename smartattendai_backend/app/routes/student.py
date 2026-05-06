from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Student, ParentStudentMapping
import logging

student_bp = Blueprint('students', __name__)


@student_bp.route('', methods=['GET'])
@jwt_required()
def get_students():
    """List all students (teacher/HOD only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403

        grade = request.args.get('grade')
        section = request.args.get('section')
        search = request.args.get('search', '').strip()
        is_active = request.args.get('is_active', 'true').lower() == 'true'

        query = Student.query.filter_by(is_active=is_active)

        if grade:
            query = query.filter_by(grade=grade)
        if section:
            query = query.filter_by(section=section)
        if search:
            query = query.filter(
                db.or_(
                    Student.first_name.ilike(f'%{search}%'),
                    Student.last_name.ilike(f'%{search}%'),
                    Student.student_id.ilike(f'%{search}%'),
                )
            )

        students = query.order_by(Student.grade, Student.section, Student.roll_number).all()

        return jsonify({
            'students': [s.to_dict() for s in students],
            'total': len(students)
        }), 200

    except Exception as e:
        logging.error(f'Error listing students: {e}')
        return jsonify({'error': f'Failed to list students: {str(e)}'}), 500


@student_bp.route('', methods=['POST'])
@jwt_required()
def create_student():
    """Create a new student (teacher/HOD only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        required = ['student_id', 'first_name', 'last_name']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        if Student.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'error': 'Student ID already exists'}), 409

        student = Student(
            student_id=data['student_id'].strip(),
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            email=data.get('email', '').strip() or None,
            phone=data.get('phone', '').strip() or None,
            grade=data.get('grade', '').strip() or None,
            section=data.get('section', '').strip() or None,
            roll_number=data.get('roll_number', '').strip() or None,
        )

        db.session.add(student)
        db.session.commit()

        return jsonify({
            'message': 'Student created successfully',
            'student': student.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f'Error creating student: {e}')
        return jsonify({'error': f'Failed to create student: {str(e)}'}), 500


@student_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    """Get single student"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role == 'parent':
            mapping = ParentStudentMapping.query.filter_by(
                parent_id=user_id, student_id=student_id
            ).first()
            if not mapping:
                return jsonify({'error': 'Unauthorized'}), 403
        elif user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403

        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        return jsonify({'student': student.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get student: {str(e)}'}), 500


@student_bp.route('/<int:student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    """Update student details (teacher/HOD only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403

        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        data = request.get_json()
        allowed = ['first_name', 'last_name', 'email', 'phone', 'grade', 'section', 'roll_number', 'is_active']
        for field in allowed:
            if field in data:
                setattr(student, field, data[field])

        db.session.commit()

        return jsonify({
            'message': 'Student updated successfully',
            'student': student.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update student: {str(e)}'}), 500


@student_bp.route('/grades', methods=['GET'])
@jwt_required()
def get_grades():
    """Return distinct grade/section combos for filter dropdowns"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403

        rows = db.session.query(Student.grade, Student.section)\
            .filter(Student.is_active == True)\
            .distinct()\
            .order_by(Student.grade, Student.section)\
            .all()

        result = [{'grade': r.grade, 'section': r.section} for r in rows if r.grade]

        return jsonify({'classes': result}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get grades: {str(e)}'}), 500
