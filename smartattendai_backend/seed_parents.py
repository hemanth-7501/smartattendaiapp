import os
import random
from datetime import date, timedelta
from app import create_app, db
from app.models import User, Student, ParentStudentMapping, Attendance

app = create_app()

parents_data = [
    {"phone": "8431689810", "student_name": "Varun", "grade": "BCA"},
    {"phone": "8861561209", "student_name": "Kishore", "grade": "BCA"},
    {"phone": "7019851533", "student_name": "Darshan", "grade": "MCA"},
]

def seed_data():
    with app.app_context():
        print("Seeding parent and student data...")
        teacher = User.query.filter_by(role='teacher').first()
        if not teacher:
            teacher = User(username="default_teacher", email="teacher@example.com", role="teacher")
            teacher.set_password("password")
            db.session.add(teacher)
            db.session.commit()

        for p_data in parents_data:
            phone = p_data["phone"]
            s_name = p_data["student_name"]
            grade = p_data["grade"]
            
            # 1. Create or get Parent
            parent = User.query.filter_by(phone=phone, role='parent').first()
            if not parent:
                parent = User(
                    username=f"parent_{phone}",
                    email=f"parent_{phone}@example.com",
                    role="parent",
                    phone=phone,
                    first_name="Parent of " + s_name,
                    last_name=""
                )
                parent.set_password("password")
                db.session.add(parent)
                db.session.commit()
                print(f"Created parent for {phone}")

            # 2. Create or get Student
            student = Student.query.filter_by(first_name=s_name, grade=grade).first()
            if not student:
                student = Student(
                    student_id=f"STU_{s_name.upper()}",
                    first_name=s_name,
                    last_name="",
                    grade=grade,
                    section="A",
                    roll_number=str(random.randint(10, 99))
                )
                db.session.add(student)
                db.session.commit()
                print(f"Created student {s_name} ({grade})")

            # 3. Create mapping
            mapping = ParentStudentMapping.query.filter_by(parent_id=parent.id, student_id=student.id).first()
            if not mapping:
                mapping = ParentStudentMapping(parent_id=parent.id, student_id=student.id)
                db.session.add(mapping)
                db.session.commit()
                print(f"Created mapping for {s_name}")

            # 4. Generate some dummy attendance for the last 30 days
            # Let's say 85% attendance
            since = date.today() - timedelta(days=30)
            existing_att = Attendance.query.filter_by(student_id=student.id).count()
            if existing_att == 0:
                for i in range(30):
                    curr_date = since + timedelta(days=i)
                    if curr_date.weekday() < 5:  # Monday to Friday
                        # Randomly present or absent (85% present)
                        status = "present" if random.random() < 0.85 else "absent"
                        att = Attendance(
                            student_id=student.id,
                            teacher_id=teacher.id,
                            date=curr_date,
                            status=status,
                            subject="Core Subject"
                        )
                        db.session.add(att)
                db.session.commit()
                print(f"Generated attendance for {s_name}")

if __name__ == '__main__':
    seed_data()
