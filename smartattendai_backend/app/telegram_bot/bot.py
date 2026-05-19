import os
import logging
import asyncio
import threading
from datetime import date, timedelta
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ContextTypes, filters,
)

logger = logging.getLogger(__name__)

# ─── Helpers ────────────────────────────────────────────────────────────────

def _get_mapping_by_chat(chat_id: str):
    from app.models import ParentStudentMapping
    return ParentStudentMapping.query.filter_by(telegram_chat_id=str(chat_id)).first()

def _get_all_mappings_by_chat(chat_id: str):
    from app.models import ParentStudentMapping
    return ParentStudentMapping.query.filter_by(telegram_chat_id=str(chat_id)).all()

def _get_parent_by_phone(phone: str):
    from app.models import User
    clean = phone.replace("+", "").replace(" ", "").strip()
    user = User.query.filter_by(phone=clean, role="parent").first()
    if not user:
        user = User.query.filter_by(phone="+" + clean, role="parent").first()
    if not user:
        # Try last 10 digits
        user = User.query.filter(
            User.role == "parent",
            User.phone.like("%" + clean[-10:])
        ).first()
    return user

def _create_mock_parent_and_student(phone: str):
    import random
    from app import db
    from app.models import User, Student, ParentStudentMapping, Attendance
    
    clean = phone.replace("+", "").replace(" ", "").strip()
    
    teacher = User.query.filter_by(role='teacher').first()
    if not teacher:
        teacher = User(username="demo_teacher", email="teacher@demo.com", role="teacher")
        teacher.set_password("password")
        db.session.add(teacher)
        db.session.commit()
        
    parent = User(
        username=f"parent_{clean}_{random.randint(1000, 9999)}",
        email=f"parent_{clean}@demo.com",
        role="parent",
        phone=clean,
        first_name="Demo Parent",
        last_name=""
    )
    parent.set_password("password")
    db.session.add(parent)
    db.session.commit()
    
    grade = random.choice(["BCA", "MCA"])
    first_names = ["Arjun", "Riya", "Aditya", "Neha", "Karthik", "Pooja", "Rahul", "Sneha", "Vikram", "Anjali"]
    s_name = random.choice(first_names)
    
    student = Student(
        student_id=f"DEMO_{clean[:4]}{random.randint(10, 99)}",
        first_name=s_name,
        last_name="",
        grade=grade,
        section="A",
        roll_number=str(random.randint(1, 100))
    )
    db.session.add(student)
    db.session.commit()
    
    mapping = ParentStudentMapping(parent_id=parent.id, student_id=student.id)
    db.session.add(mapping)
    db.session.commit()
    
    since = date.today() - timedelta(days=30)
    bca_subs = ['C Programming', 'Cloud Computing', 'Microcontroller', 'DBMS', 'Mathematics']
    mca_subs = ['Advanced Java', 'Software Engineering', 'Cloud Computing', 'Data Science', 'Python Programming']
    subjects = mca_subs if grade == 'MCA' else bca_subs
    
    for i in range(30):
        curr_date = since + timedelta(days=i)
        if curr_date.weekday() < 5:
            status = "present" if random.random() < 0.85 else "absent"
            att = Attendance(
                student_id=student.id,
                teacher_id=teacher.id,
                date=curr_date,
                status=status,
                subject=random.choice(subjects)
            )
            db.session.add(att)
    db.session.commit()
    
    return parent

def _link_chat_to_parent(parent_id: int, chat_id: str):
    """Link telegram_chat_id to ALL mappings belonging to this parent."""
    from app import db
    from app.models import ParentStudentMapping
    
    # First, unlink this chat_id from any other parent's mappings
    old_mappings = ParentStudentMapping.query.filter(
        ParentStudentMapping.telegram_chat_id == str(chat_id),
        ParentStudentMapping.parent_id != parent_id
    ).all()
    for old_m in old_mappings:
        old_m.telegram_chat_id = None
        
    mappings = ParentStudentMapping.query.filter_by(parent_id=parent_id).all()
    for m in mappings:
        m.telegram_chat_id = str(chat_id)
    db.session.commit()
    return len(mappings)

def _attendance_summary(chat_id: str, days: int = 30):
    """Return a formatted attendance summary string for all children linked to this chat."""
    from app.models import ParentStudentMapping, Student, Attendance
    mappings = _get_all_mappings_by_chat(chat_id)
    if not mappings:
        return None
    lines = []
    for mapping in mappings:
        student = Student.query.get(mapping.student_id)
        if not student:
            continue
        since = date.today() - timedelta(days=days)
        records = Attendance.query.filter(
            Attendance.student_id == student.id,
            Attendance.date >= since,
        ).all()
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        late = sum(1 for r in records if r.status == "late")
        pct = (present / total * 100) if total > 0 else 0
        emoji = "✅" if pct >= 75 else "⚠️"
        lines.append(
            f"{emoji} <b>{student.first_name} {student.last_name}</b>\n"
            f"  Class: {student.grade} {student.section} | Roll: {student.roll_number}\n"
            f"  Period: Last {days} days\n"
            f"  Total: {total} | Present: {present} | Absent: {absent} | Late: {late}\n"
            f"  Attendance: <b>{pct:.1f}%</b>"
        )
    return "\n\n".join(lines) if lines else None

def _today_summary(chat_id: str):
    from app.models import ParentStudentMapping, Student, Attendance
    mappings = _get_all_mappings_by_chat(chat_id)
    if not mappings:
        return None
    today = date.today()
    lines = []
    for mapping in mappings:
        student = Student.query.get(mapping.student_id)
        if not student:
            continue
        rec = Attendance.query.filter_by(student_id=student.id, date=today).first()
        if rec:
            s = rec.status
            ico = "✅" if s == "present" else ("❌" if s == "absent" else "⏰")
            lines.append(f"{ico} <b>{student.first_name}</b>: {s.title()}")
        else:
            lines.append(f"❓ <b>{student.first_name}</b>: Not marked yet")
    return "\n".join(lines) if lines else None

# ─── Handlers ────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    args = context.args or []

    if args:
        phone = args[0].strip()
        if phone:
            from app import db
            parent = _get_parent_by_phone(phone)
            if not parent:
                parent = _create_mock_parent_and_student(phone)

            count = _link_chat_to_parent(parent.id, chat_id)
            await update.message.reply_text(
                "✅ Your Telegram account is linked successfully! You can now ask me about attendance, reports, and your dashboard.",
                parse_mode="HTML",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

    kb = [[KeyboardButton("📱 Share Phone Number to Login", request_contact=True)]]
    markup = ReplyKeyboardMarkup(kb, one_time_keyboard=True, resize_keyboard=True)
    await update.message.reply_text(
        "👋 <b>Welcome to SmartAttendAI Telegram Bot!</b>\n\n"
        "I can help you track attendance, marks, and school updates.\n\n"
        "🔐 <b>Please Login to Continue</b>\n"
        "Click the button below to securely link your account using your phone number.\n\n"
        "Once logged in, you can asking things like:\n"
        "• 'Show today's attendance'\n"
        "• 'Weekly report'\n"
        "• 'Show dashboard'",
        parse_mode="HTML",
        reply_markup=markup,
    )
    await cmd_help(update, context)

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🔍 <b>SmartAttendAI Bot Commands</b>\n\n"
        "<b>Account Commands:</b>\n"
        "• /link &lt;usernameorphone&gt; - Link your account\n\n"
        "<b>Attendance Commands:</b>\n"
        "• /attendance - View attendance summary\n"
        "• /today - Check today's attendance\n"
        "• /weekly - Get weekly report\n"
        "• /monthly - Get monthly report\n"
        "• /detailed - View detailed logs\n\n"
        "<b>Academic Commands:</b>\n"
        "• /marks - View marks/grades\n"
        "• /dashboard - View dashboard\n\n"
        "<b>Try asking me things like:</b>\n"
        "• 'Show today's attendance'\n"
        "• 'Weekly attendance report'\n"
        "• 'Show dashboard'\n"
        "• 'Any alerts?'\n"
        "• 'Show stats' (Teachers)\n"
        "• 'How is my child doing?' (Parents)",
        parse_mode="HTML",
    )

async def cmd_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manual link: /link <phone_or_username>"""
    chat_id = str(update.effective_chat.id)
    args = context.args
    if not args:
        await update.message.reply_text(
            "Usage: /link &lt;phone_number&gt;\n"
            "Example: /link 9535960697",
            parse_mode="HTML",
        )
        return
    phone = args[0].strip()
    from app import db
    with db.engine.connect():
        parent = _get_parent_by_phone(phone)
        if not parent:
            # Auto-provision for demo
            parent = _create_mock_parent_and_student(phone)
            
        count = _link_chat_to_parent(parent.id, chat_id)
        await update.message.reply_text(
            f"✅ Account linked successfully! You are registered as a parent (Demo Mode if new).",
            reply_markup=ReplyKeyboardRemove(),
        )

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle shared phone number for automatic account linking."""
    contact = update.message.contact
    chat_id = str(update.effective_chat.id)
    phone = contact.phone_number
    parent = _get_parent_by_phone(phone)
    if not parent:
        # Auto-provision for demo
        parent = _create_mock_parent_and_student(phone)
        
    count = _link_chat_to_parent(parent.id, chat_id)
    await update.message.reply_text(
        f"✅ Account linked successfully! You are registered as a parent (Demo Mode if new).",
        reply_markup=ReplyKeyboardRemove(),
    )

async def cmd_attendance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    summary = _attendance_summary(chat_id, days=30)
    if summary is None:
        await update.message.reply_text(
            "⚠️ Your account is not linked yet.\n"
            "Use /link &lt;phone&gt; or tap /start to link via phone number.",
            parse_mode="HTML",
        )
        return
    await update.message.reply_text(
        f"📊 <b>Attendance Summary (Last 30 Days)</b>\n\n{summary}",
        parse_mode="HTML",
    )

async def cmd_today(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    summary = _today_summary(chat_id)
    if summary is None:
        await update.message.reply_text(
            "⚠️ Your account is not linked yet. Use /start to link.",
            parse_mode="HTML",
        )
        return
    today_str = date.today().strftime("%B %d, %Y")
    await update.message.reply_text(
        f"📅 <b>Today's Attendance — {today_str}</b>\n\n{summary}",
        parse_mode="HTML",
    )

async def cmd_weekly(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    summary = _attendance_summary(chat_id, days=7)
    if summary is None:
        await update.message.reply_text("⚠️ Account not linked. Use /start to link.")
        return
    await update.message.reply_text(
        f"📈 <b>Weekly Attendance Report (Last 7 Days)</b>\n\n{summary}",
        parse_mode="HTML",
    )

async def cmd_monthly(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    summary = _attendance_summary(chat_id, days=30)
    if summary is None:
        await update.message.reply_text("⚠️ Account not linked. Use /start to link.")
        return
    await update.message.reply_text(
        f"📆 <b>Monthly Attendance Report</b>\n\n{summary}",
        parse_mode="HTML",
    )

async def cmd_detailed(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models import ParentStudentMapping, Student, Attendance
    chat_id = str(update.effective_chat.id)
    mappings = _get_all_mappings_by_chat(chat_id)
    if not mappings:
        await update.message.reply_text("⚠️ Account not linked. Use /start to link.")
        return
    since = date.today() - timedelta(days=30)
    lines = []
    for mapping in mappings:
        student = Student.query.get(mapping.student_id)
        if not student:
            continue
        records = Attendance.query.filter(
            Attendance.student_id == student.id,
            Attendance.date >= since,
        ).order_by(Attendance.date.desc()).limit(15).all()
        lines.append(f"📋 <b>{student.first_name} {student.last_name}</b>")
        if records:
            for r in records:
                ico = "✅" if r.status == "present" else ("❌" if r.status == "absent" else "⏰")
                lines.append(f"  {ico} {r.date} — {r.status.title()}{(' · ' + r.subject) if r.subject else ''}")
        else:
            lines.append("  No records found.")
        lines.append("")
    await update.message.reply_text(
        f"📋 <b>Detailed Attendance Log (Last 30 Days)</b>\n\n" + "\n".join(lines),
        parse_mode="HTML",
    )

async def cmd_marks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models import ParentStudentMapping, Student
    chat_id = str(update.effective_chat.id)
    mappings = _get_all_mappings_by_chat(chat_id)
    if not mappings:
        await update.message.reply_text("⚠️ Account not linked. Use /start to link.")
        return
        
    lines = ["📊 <b>Marks & Grades Report</b>\n"]
    
    bca_subjects = [("C Programming", "85/100", "A"), ("Mathematics", "78/100", "B+"), ("Computer Fundamentals", "92/100", "A+"), ("English", "88/100", "A")]
    mca_subjects = [("Advanced Java", "88/100", "A"), ("Software Engineering", "90/100", "A+"), ("Cloud Computing", "82/100", "A-"), ("Data Science", "95/100", "O")]
    
    for mapping in mappings:
        student = Student.query.get(mapping.student_id)
        if not student:
            continue
            
        lines.append(f"🎓 <b>{student.first_name} {student.last_name}</b> - {student.grade}")
        lines.append("<i>Recent Examination (Mid-Term)</i>\n")
        
        subjects = mca_subjects if student.grade.upper() == "MCA" else bca_subjects
        
        for sub, marks, grade in subjects:
            lines.append(f"  📖 {sub}: <b>{marks}</b> (Grade: {grade})")
            
        lines.append("")
        
    lines.append("Use /dashboard for full overview.")
    
    await update.message.reply_text("\n".join(lines), parse_mode="HTML")

async def cmd_dashboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from app.models import ParentStudentMapping, Student, Attendance
    chat_id = str(update.effective_chat.id)
    mappings = _get_all_mappings_by_chat(chat_id)
    if not mappings:
        await update.message.reply_text("⚠️ Account not linked. Use /start to link.")
        return
    today = date.today()
    since = today - timedelta(days=30)
    lines = [f"🏠 <b>Parent Dashboard</b> — {today.strftime('%B %d, %Y')}\n"]
    for mapping in mappings:
        student = Student.query.get(mapping.student_id)
        if not student:
            continue
        records = Attendance.query.filter(
            Attendance.student_id == student.id,
            Attendance.date >= since,
        ).all()
        today_rec = Attendance.query.filter_by(student_id=student.id, date=today).first()
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        pct = (present / total * 100) if total > 0 else 0
        status_ico = "✅ Present" if today_rec and today_rec.status == "present" else (
            "❌ Absent" if today_rec and today_rec.status == "absent" else "❓ Not Marked"
        )
        bar_filled = int(pct / 10)
        bar = "█" * bar_filled + "░" * (10 - bar_filled)
        lines.append(
            f"👤 <b>{student.first_name} {student.last_name}</b>\n"
            f"  Roll: {student.roll_number} | Class: {student.grade} {student.section}\n"
            f"  Today: {status_ico}\n"
            f"  [{bar}] {pct:.1f}%\n"
            f"  Total: {total} | Present: {present} | Absent: {absent}"
        )
    await update.message.reply_text("\n\n".join(lines), parse_mode="HTML")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """NLP fallback for natural language queries."""
    text = (update.message.text or "").lower()
    if any(w in text for w in ["today", "আজ", "present today"]):
        await cmd_today(update, context)
    elif any(w in text for w in ["weekly", "week", "7 day"]):
        await cmd_weekly(update, context)
    elif any(w in text for w in ["monthly", "month"]):
        await cmd_monthly(update, context)
    elif any(w in text for w in ["detail", "log", "history"]):
        await cmd_detailed(update, context)
    elif any(w in text for w in ["mark", "grade", "score"]):
        await cmd_marks(update, context)
    elif any(w in text for w in ["dashboard", "overview", "summary", "how is my child"]):
        await cmd_dashboard(update, context)
    elif any(w in text for w in ["attendance", "present", "absent"]):
        await cmd_attendance(update, context)
    elif any(w in text for w in ["help", "command"]):
        await cmd_help(update, context)
    elif any(w in text for w in ["enquiry", "admission", "contact", "info"]):
        await update.message.reply_text(
            "📞 <b>School Enquiry & Support</b>\n\n"
            "We are happy to assist you! For general enquiries, admissions, or support, please contact the administration:\n\n"
            "📧 <b>Email:</b> admin@smartattendai.edu\n"
            "📱 <b>Phone:</b> +1 234 567 8900\n"
            "⏰ <b>Office Hours:</b> Mon - Fri, 8:00 AM - 4:00 PM\n\n"
            "For attendance or specific student info, you can use /dashboard or ask me directly.",
            parse_mode="HTML"
        )
    else:
        await update.message.reply_text(
            "🤔 I didn't understand that.\n\n"
            "Try commands like:\n"
            "• /today — today's attendance\n"
            "• /weekly — weekly report\n"
            "• /dashboard — full overview\n"
            "• /help — all commands\n"
            "• 'enquiry' — for school contact info",
        )

# ─── Bot runner ──────────────────────────────────────────────────────────────

def run_bot(flask_app):
    """Run the Telegram bot in polling mode inside a Flask app context."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled.")
        return

    async def _main():
        app = Application.builder().token(token).build()
        app.add_handler(CommandHandler("start", cmd_start))
        app.add_handler(CommandHandler("help", cmd_help))
        app.add_handler(CommandHandler("link", cmd_link))
        app.add_handler(CommandHandler("attendance", cmd_attendance))
        app.add_handler(CommandHandler("today", cmd_today))
        app.add_handler(CommandHandler("weekly", cmd_weekly))
        app.add_handler(CommandHandler("monthly", cmd_monthly))
        app.add_handler(CommandHandler("detailed", cmd_detailed))
        app.add_handler(CommandHandler("marks", cmd_marks))
        app.add_handler(CommandHandler("dashboard", cmd_dashboard))
        app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

        logger.info("SmartAttendAI Telegram bot starting (polling)…")
        async with app:
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)
            # Keep alive
            while True:
                await asyncio.sleep(3600)

    def _thread_target():
        with flask_app.app_context():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(_main())
            except Exception as e:
                logger.error(f"Telegram bot crashed: {e}")
            finally:
                loop.close()

    t = threading.Thread(target=_thread_target, daemon=True, name="telegram-bot")
    t.start()
    logger.info("Telegram bot thread started.")
