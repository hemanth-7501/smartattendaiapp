from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Attendance, Student, User, ParentStudentMapping, TelegramNotification
from datetime import datetime, date
from app.services.telegram_service import TelegramService
import logging

attendance_bp = Blueprint('attendance', __name__)
telegram_service = TelegramService()

@attendance_bp.route('/mark', methods=['POST'])
@jwt_required()
def mark_attendance():
    """Mark attendance for students"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized. Only teachers and HOD can mark attendance'}), 403
        
        data = request.get_json()
        
        if not data or 'attendances' not in data:
            return jsonify({'error': 'Attendance data is required'}), 400
        
        attendances = data['attendances']
        attendance_date = data.get('date', date.today().isoformat())
        subject = data.get('subject', '')
        period = data.get('period', '')
        
        # Validate date format
        try:
            attendance_date = datetime.fromisoformat(attendance_date).date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        marked_attendances = []
        alerts_triggered = []
        
        for attendance_data in attendances:
            student_id = attendance_data.get('student_id')
            status = attendance_data.get('status', '').lower()
            notes = attendance_data.get('notes', '')
            
            if not student_id or status not in ['present', 'absent', 'late']:
                continue
            
            # Check if student exists
            student = Student.query.get(student_id)
            if not student:
                continue
            
            # Check if attendance already exists for this student on this date
            existing = Attendance.query.filter_by(
                student_id=student_id,
                date=attendance_date,
                subject=subject,
                period=period
            ).first()
            
            if existing:
                # Update existing attendance
                existing.status = status
                existing.notes = notes
                existing.teacher_id = user_id
                existing.updated_at = datetime.utcnow()
                attendance = existing
            else:
                # Create new attendance record
                attendance = Attendance(
                    student_id=student_id,
                    teacher_id=user_id,
                    date=attendance_date,
                    status=status,
                    subject=subject,
                    period=period,
                    notes=notes
                )
                db.session.add(attendance)
            
            marked_attendances.append(attendance.to_dict())
            
            # Check for red flag alerts (attendance below 75%)
            if status == 'absent':
                alerts_triggered.extend(check_attendance_alerts(student_id, attendance_date))
        
        db.session.commit()
        
        # Send Telegram notifications for alerts
        for alert in alerts_triggered:
            telegram_service.send_alert(alert['parent_id'], alert['message'])
        
        return jsonify({
            'message': 'Attendance marked successfully',
            'attendances': marked_attendances,
            'alerts_triggered': len(alerts_triggered)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Error marking attendance: {str(e)}')
        return jsonify({'error': f'Failed to mark attendance: {str(e)}'}), 500

def check_attendance_alerts(student_id, current_date):
    """Check if student attendance is below 75% and trigger alerts"""
    alerts = []
    
    # Get attendance records for the current month
    start_of_month = current_date.replace(day=1)
    
    attendances = Attendance.query.filter(
        Attendance.student_id == student_id,
        Attendance.date >= start_of_month,
        Attendance.date <= current_date
    ).all()
    
    if not attendances:
        return alerts
    
    total_days = len(attendances)
    present_days = len([a for a in attendances if a.status == 'present'])
    attendance_percentage = (present_days / total_days) * 100
    
    if attendance_percentage < 75:
        # Get parent mappings for this student
        mappings = ParentStudentMapping.query.filter_by(student_id=student_id).all()
        
        student = Student.query.get(student_id)
        
        for mapping in mappings:
            parent = User.query.get(mapping.parent_id)
            if parent and mapping.telegram_chat_id:
                message = f"🚨 ALERT: {student.first_name} {student.last_name}'s attendance is critically low!\n\n" \
                         f"Current Month Attendance: {attendance_percentage:.1f}%\n" \
                         f"Present: {present_days}/{total_days} days\n\n" \
                         f"Please contact the school immediately."
                
                alerts.append({
                    'parent_id': parent.id,
                    'message': message,
                    'student_id': student_id
                })
                
                # Log the notification
                notification = TelegramNotification(
                    parent_id=parent.id,
                    student_id=student_id,
                    message=message,
                    message_type='alert'
                )
                db.session.add(notification)
    
    return alerts

@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_attendance(student_id):
    """Get attendance records for a specific student"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check permissions
        if user.role == 'parent':
            # Parents can only view their children's attendance
            mapping = ParentStudentMapping.query.filter_by(
                parent_id=user_id, 
                student_id=student_id
            ).first()
            if not mapping:
                return jsonify({'error': 'Unauthorized to view this student\'s attendance'}), 403
        elif user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        subject = request.args.get('subject')
        
        query = Attendance.query.filter_by(student_id=student_id)
        
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date).date()
                query = query.filter(Attendance.date >= start_date)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date).date()
                query = query.filter(Attendance.date <= end_date)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        
        if subject:
            query = query.filter(Attendance.subject.ilike(f'%{subject}%'))
        
        attendances = query.order_by(Attendance.date.desc()).all()
        
        return jsonify({
            'student_id': student_id,
            'attendances': [a.to_dict() for a in attendances],
            'total_records': len(attendances)
        }), 200
        
    except Exception as e:
        logging.error(f'Error getting student attendance: {str(e)}')
        return jsonify({'error': f'Failed to get attendance: {str(e)}'}), 500

@attendance_bp.route('/class', methods=['GET'])
@jwt_required()
def get_class_attendance():
    """Get attendance for a class/section on a specific date"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized. Only teachers and HOD can view class attendance'}), 403
        
        # Get query parameters
        attendance_date = request.args.get('date', date.today().isoformat())
        grade = request.args.get('grade')
        section = request.args.get('section')
        subject = request.args.get('subject')
        
        try:
            attendance_date = datetime.fromisoformat(attendance_date).date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Build query for students
        student_query = Student.query.filter_by(is_active=True)
        if grade:
            student_query = student_query.filter_by(grade=grade)
        if section:
            student_query = student_query.filter_by(section=section)
        
        students = student_query.all()
        
        attendance_records = []
        for student in students:
            attendance = Attendance.query.filter_by(
                student_id=student.id,
                date=attendance_date
            ).first()
            
            if subject and attendance and attendance.subject != subject:
                attendance = None
            
            record = {
                'student': student.to_dict(),
                'attendance': attendance.to_dict() if attendance else None
            }
            attendance_records.append(record)
        
        return jsonify({
            'date': attendance_date.isoformat(),
            'grade': grade,
            'section': section,
            'subject': subject,
            'records': attendance_records,
            'total_students': len(attendance_records)
        }), 200
        
    except Exception as e:
        logging.error(f'Error getting class attendance: {str(e)}')
        return jsonify({'error': f'Failed to get class attendance: {str(e)}'}), 500

@attendance_bp.route('/report', methods=['GET'])
@jwt_required()
def get_attendance_report():
    """Generate attendance report"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in ['teacher', 'hod']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
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
        
        # Get students
        student_query = Student.query.filter_by(is_active=True)
        if grade:
            student_query = student_query.filter_by(grade=grade)
        if section:
            student_query = student_query.filter_by(section=section)
        
        students = student_query.all()
        
        report_data = []
        for student in students:
            attendances = Attendance.query.filter(
                Attendance.student_id == student.id,
                Attendance.date >= start_date,
                Attendance.date <= end_date
            ).all()
            
            total_days = len(attendances)
            present_days = len([a for a in attendances if a.status == 'present'])
            absent_days = len([a for a in attendances if a.status == 'absent'])
            late_days = len([a for a in attendances if a.status == 'late'])
            
            attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
            
            report_data.append({
                'student': student.to_dict(),
                'summary': {
                    'total_days': total_days,
                    'present_days': present_days,
                    'absent_days': absent_days,
                    'late_days': late_days,
                    'attendance_percentage': round(attendance_percentage, 2)
                }
            })
        
        return jsonify({
            'report_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'filters': {
                'grade': grade,
                'section': section
            },
            'data': report_data,
            'total_students': len(report_data)
        }), 200
        
    except Exception as e:
        logging.error(f'Error generating attendance report: {str(e)}')
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500