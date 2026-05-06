from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Student, ParentStudentMapping, Attendance
from app.services.telegram_service import TelegramService
from datetime import date, datetime

parent_bp = Blueprint('parents', __name__)
telegram_service = TelegramService()

@parent_bp.route('/children', methods=['GET'])
@jwt_required()
def get_children():
    """Get parent's children"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'parent':
            return jsonify({'error': 'Unauthorized. Only parents can access this endpoint'}), 403
        
        # Get parent-student mappings
        mappings = ParentStudentMapping.query.filter_by(parent_id=user_id).all()
        
        children = []
        for mapping in mappings:
            student = Student.query.get(mapping.student_id)
            if student and student.is_active:
                children.append({
                    'student': student.to_dict(),
                    'mapping': mapping.to_dict()
                })
        
        return jsonify({
            'children': children,
            'total': len(children)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get children: {str(e)}'}), 500

@parent_bp.route('/children/<int:student_id>/attendance', methods=['GET'])
@jwt_required()
def get_child_attendance(student_id):
    """Get attendance for a specific child"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'parent':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Verify parent-child relationship
        mapping = ParentStudentMapping.query.filter_by(
            parent_id=user_id,
            student_id=student_id
        ).first()
        
        if not mapping:
            return jsonify({'error': 'Unauthorized to view this child\'s attendance'}), 403
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 30, type=int)
        
        query = Attendance.query.filter_by(student_id=student_id)
        
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date).date()
                query = query.filter(Attendance.date >= start_date)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format'}), 400
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date).date()
                query = query.filter(Attendance.date <= end_date)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format'}), 400
        
        attendances = query.order_by(Attendance.date.desc()).limit(limit).all()
        
        # Calculate attendance statistics
        total_days = len(attendances)
        present_days = len([a for a in attendances if a.status == 'present'])
        absent_days = len([a for a in attendances if a.status == 'absent'])
        late_days = len([a for a in attendances if a.status == 'late'])
        
        attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        return jsonify({
            'student_id': student_id,
            'attendances': [a.to_dict() for a in attendances],
            'statistics': {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'attendance_percentage': round(attendance_percentage, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get attendance: {str(e)}'}), 500

@parent_bp.route('/link-telegram', methods=['POST'])
@jwt_required()
def link_telegram():
    """Link Telegram chat ID to parent account"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'parent':
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if 'chat_id' not in data or 'student_id' not in data:
            return jsonify({'error': 'chat_id and student_id are required'}), 400
        
        chat_id = data['chat_id']
        student_id = data['student_id']
        
        # Verify parent-child relationship
        mapping = ParentStudentMapping.query.filter_by(
            parent_id=user_id,
            student_id=student_id
        ).first()
        
        if not mapping:
            return jsonify({'error': 'Parent-child relationship not found'}), 404
        
        # Link Telegram chat ID
        success = telegram_service.register_chat_id(user_id, student_id, chat_id)
        
        if success:
            return jsonify({
                'message': 'Telegram account linked successfully',
                'chat_id': chat_id
            }), 200
        else:
            return jsonify({'error': 'Failed to link Telegram account'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Failed to link Telegram: {str(e)}'}), 500

@parent_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get parent's notifications"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'parent':
            return jsonify({'error': 'Unauthorized'}), 403
        
        from app.models import TelegramNotification
        
        limit = request.args.get('limit', 50, type=int)
        
        notifications = TelegramNotification.query.filter_by(parent_id=user_id)\
            .order_by(TelegramNotification.sent_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'total': len(notifications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get notifications: {str(e)}'}), 500

@parent_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get parent dashboard data"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'parent':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get children and their attendance summary
        mappings = ParentStudentMapping.query.filter_by(parent_id=user_id).all()
        
        dashboard_data = []
        
        for mapping in mappings:
            student = Student.query.get(mapping.student_id)
            if not student or not student.is_active:
                continue
            
            # Get recent attendance (last 30 days)
            from datetime import timedelta
            thirty_days_ago = date.today() - timedelta(days=30)
            
            recent_attendances = Attendance.query.filter(
                Attendance.student_id == student.id,
                Attendance.date >= thirty_days_ago
            ).all()
            
            total_days = len(recent_attendances)
            present_days = len([a for a in recent_attendances if a.status == 'present'])
            absent_days = len([a for a in recent_attendances if a.status == 'absent'])
            late_days = len([a for a in recent_attendances if a.status == 'late'])
            attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
            
            # Get today's attendance
            today_attendance = Attendance.query.filter_by(
                student_id=student.id,
                date=date.today()
            ).first()
            
            dashboard_data.append({
                'student': student.to_dict(),
                'recent_stats': {
                    'total_days': total_days,
                    'present_days': present_days,
                    'absent_days': absent_days,
                    'late_days': late_days,
                    'attendance_percentage': round(attendance_percentage, 2)
                },
                'today_attendance': today_attendance.to_dict() if today_attendance else None,
                'alert_status': 'critical' if attendance_percentage < 75 else 'normal'
            })
        
        return jsonify({
            'dashboard': dashboard_data,
            'total_children': len(dashboard_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get dashboard: {str(e)}'}), 500