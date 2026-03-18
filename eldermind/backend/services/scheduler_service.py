"""
ElderMind — Reminder Scheduler Service
Owner: Shivani (Backend Engineer 2)

Runs inside FastAPI on startup (called from main.py startup event).
Polls PostgreSQL every 60 seconds for reminders due in the next minute.
Fires Twilio SMS and marks reminders as sent.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from twilio.rest import Client
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from models.database import SessionLocal
from models.orm import Reminder
import os, logging

logger = logging.getLogger("scheduler")

TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM  = os.getenv("TWILIO_FROM_NUMBER")
IST          = ZoneInfo("Asia/Kolkata")


def send_sms(to_number: str, message: str) -> bool:
    """Send an SMS via Twilio. Returns True on success, False on failure."""
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        client.messages.create(body=message, from_=TWILIO_FROM, to=to_number)
        logger.info(f"SMS sent to {to_number}: {message[:60]}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {to_number}: {e}")
        return False


async def check_and_fire_reminders():
    """
    Runs every 60 seconds.
    Finds reminders due within the next 60-second window.
    Sends Twilio SMS and marks them as sent.
    """
    now        = datetime.now(IST).replace(tzinfo=None)
    window_end = now + timedelta(seconds=60)

    db = SessionLocal()
    try:
        due = db.query(Reminder).filter(
            Reminder.remind_at >= now,
            Reminder.remind_at <= window_end,
            Reminder.is_sent == False,
        ).all()

        for reminder in due:
            msg     = f"ElderMind Reminder: {reminder.title}. {reminder.message}"
            success = send_sms(reminder.phone_number, msg)
            if success:
                if reminder.is_recurring:
                    # TODO (Shivani Week 5): parse recur_cron and update remind_at to next occurrence
                    pass
                else:
                    reminder.is_sent = True
                db.commit()
                logger.info(f"Reminder {reminder.id} fired.")

    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()


def start_scheduler() -> AsyncIOScheduler:
    """Call this from main.py on app startup."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_and_fire_reminders,
        trigger        = IntervalTrigger(seconds=60),
        id             = "reminder_checker",
        replace_existing = True,
    )
    scheduler.start()
    logger.info("Reminder scheduler started — checking every 60 seconds.")
    return scheduler
