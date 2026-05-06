import os
import logging
from telegram import Bot
from telegram.error import TelegramError
from app import db
from app.models import TelegramNotification

class TelegramService:
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.bot = Bot(token=self.bot_token) if self.bot_token else None
        self.logger = logging.getLogger(__name__)
    
    def send_alert(self, parent_id, message):
        """Send attendance alert to parent via Telegram"""
        try:
            if not self.bot:
                self.logger.error("Telegram bot not configured")
                return False
            
            # Get parent's Telegram chat ID from database
            from app.models import ParentStudentMapping
            mapping = ParentStudentMapping.query.filter_by(parent_id=parent_id).first()
            
            if not mapping or not mapping.telegram_chat_id:
                self.logger.warning(f"No Telegram chat ID found for parent {parent_id}")
                return False
            
            # Send message
            sent_message = self.bot.send_message(
                chat_id=mapping.telegram_chat_id,
                text=message,
                parse_mode='HTML'
            )
            
            # Log successful notification
            notification = TelegramNotification.query.filter_by(
                parent_id=parent_id,
                message=message
            ).first()
            
            if notification:
                notification.status = 'sent'
                notification.telegram_response = str(sent_message)
                db.session.commit()
            
            self.logger.info(f"Alert sent to parent {parent_id}")
            return True
            
        except TelegramError as e:
            self.logger.error(f"Telegram error sending alert to parent {parent_id}: {str(e)}")
            
            # Update notification status
            notification = TelegramNotification.query.filter_by(
                parent_id=parent_id,
                message=message
            ).first()
            
            if notification:
                notification.status = 'failed'
                notification.telegram_response = str(e)
                db.session.commit()
            
            return False
        except Exception as e:
            self.logger.error(f"Error sending alert to parent {parent_id}: {str(e)}")
            return False
    
    def send_report(self, parent_id, student_id, report_data):
        """Send attendance report to parent"""
        try:
            if not self.bot:
                self.logger.error("Telegram bot not configured")
                return False
            
            # Get parent's Telegram chat ID
            from app.models import ParentStudentMapping, Student
            mapping = ParentStudentMapping.query.filter_by(
                parent_id=parent_id, 
                student_id=student_id
            ).first()
            
            if not mapping or not mapping.telegram_chat_id:
                self.logger.warning(f"No Telegram chat ID found for parent {parent_id}")
                return False
            
            student = Student.query.get(student_id)
            if not student:
                return False
            
            # Format report message
            message = f"📊 Attendance Report for {student.first_name} {student.last_name}\n\n" \
                     f"Period: {report_data['period']}\n" \
                     f"Total Days: {report_data['total_days']}\n" \
                     f"Present: {report_data['present_days']}\n" \
                     f"Absent: {report_data['absent_days']}\n" \
                     f"Late: {report_data['late_days']}\n" \
                     f"Attendance: {report_data['percentage']:.1f}%\n\n"
            
            if report_data['percentage'] < 75:
                message += "⚠️ Attendance is below 75%. Please contact the school."
            
            # Send message
            sent_message = self.bot.send_message(
                chat_id=mapping.telegram_chat_id,
                text=message,
                parse_mode='HTML'
            )
            
            # Log notification
            notification = TelegramNotification(
                parent_id=parent_id,
                student_id=student_id,
                message=message,
                message_type='report'
            )
            db.session.add(notification)
            db.session.commit()
            
            self.logger.info(f"Report sent to parent {parent_id} for student {student_id}")
            return True
            
        except TelegramError as e:
            self.logger.error(f"Telegram error sending report: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Error sending report: {str(e)}")
            return False
    
    def register_chat_id(self, parent_id, student_id, chat_id):
        """Register Telegram chat ID for a parent-student mapping"""
        try:
            from app.models import ParentStudentMapping
            
            mapping = ParentStudentMapping.query.filter_by(
                parent_id=parent_id,
                student_id=student_id
            ).first()
            
            if mapping:
                mapping.telegram_chat_id = str(chat_id)
                db.session.commit()
                return True
            else:
                # Create new mapping if it doesn't exist
                mapping = ParentStudentMapping(
                    parent_id=parent_id,
                    student_id=student_id,
                    telegram_chat_id=str(chat_id)
                )
                db.session.add(mapping)
                db.session.commit()
                return True
                
        except Exception as e:
            self.logger.error(f"Error registering chat ID: {str(e)}")
            db.session.rollback()
            return False
    
    def handle_bot_message(self, update):
        """Handle incoming messages from Telegram bot"""
        try:
            if not update.message:
                return
            
            chat_id = update.message.chat_id
            text = update.message.text.lower().strip()
            
            # Simple NLP-like responses
            responses = {
                'attendance': self._handle_attendance_query,
                'report': self._handle_report_query,
                'help': self._handle_help_query,
                'status': self._handle_status_query
            }
            
            # Find matching intent
            for keyword, handler in responses.items():
                if keyword in text:
                    response = handler(chat_id, text)
                    if response:
                        self.bot.send_message(chat_id=chat_id, text=response)
                    break
            else:
                # Default response
                self.bot.send_message(
                    chat_id=chat_id,
                    text="I'm sorry, I didn't understand that. Try asking about 'attendance', 'report', 'status', or 'help'."
                )
                
        except Exception as e:
            self.logger.error(f"Error handling bot message: {str(e)}")
    
    def _handle_attendance_query(self, chat_id, text):
        """Handle attendance-related queries"""
        try:
            # Find parent by chat_id
            from app.models import ParentStudentMapping, Student, Attendance
            from datetime import date, timedelta
            
            mapping = ParentStudentMapping.query.filter_by(telegram_chat_id=str(chat_id)).first()
            if not mapping:
                return "I couldn't find your account. Please contact the school to link your Telegram account."
            
            student = Student.query.get(mapping.student_id)
            if not student:
                return "Student information not found."
            
            # Get today's attendance
            today = date.today()
            attendance = Attendance.query.filter_by(
                student_id=student.id,
                date=today
            ).first()
            
            if attendance:
                status = attendance.status.title()
                return f"Today's attendance for {student.first_name}: {status}"
            else:
                return f"No attendance marked yet for {student.first_name} today."
                
        except Exception as e:
            self.logger.error(f"Error handling attendance query: {str(e)}")
            return "Sorry, I encountered an error. Please try again later."
    
    def _handle_report_query(self, chat_id, text):
        """Handle report requests"""
        try:
            from app.models import ParentStudentMapping, Student, Attendance
            from datetime import date, timedelta
            
            mapping = ParentStudentMapping.query.filter_by(telegram_chat_id=str(chat_id)).first()
            if not mapping:
                return "I couldn't find your account. Please contact the school to link your Telegram account."
            
            student = Student.query.get(mapping.student_id)
            if not student:
                return "Student information not found."
            
            # Get this month's attendance
            today = date.today()
            start_of_month = today.replace(day=1)
            
            attendances = Attendance.query.filter(
                Attendance.student_id == student.id,
                Attendance.date >= start_of_month,
                Attendance.date <= today
            ).all()
            
            if not attendances:
                return f"No attendance records found for {student.first_name} this month."
            
            total_days = len(attendances)
            present_days = len([a for a in attendances if a.status == 'present'])
            percentage = (present_days / total_days * 100) if total_days > 0 else 0
            
            return f"Monthly Report for {student.first_name}:\n" \
                   f"Total Days: {total_days}\n" \
                   f"Present: {present_days}\n" \
                   f"Attendance: {percentage:.1f}%"
                   
        except Exception as e:
            self.logger.error(f"Error handling report query: {str(e)}")
            return "Sorry, I encountered an error. Please try again later."
    
    def _handle_help_query(self, chat_id, text):
        """Handle help requests"""
        return "🤖 SmartAttendAI Bot Help\n\n" \
               "You can ask me about:\n" \
               "• 'attendance' - Check today's attendance\n" \
               "• 'report' - Get monthly attendance report\n" \
               "• 'status' - Current attendance status\n\n" \
               "I'll notify you automatically when your child's attendance drops below 75%."
    
    def _handle_status_query(self, chat_id, text):
        """Handle status queries"""
        return self._handle_attendance_query(chat_id, text)