"""
ElderMind — Reminders Router
Owner: Shivani (Backend Engineer 2)

Endpoints:
  POST   /reminders/create        — create a new reminder (APScheduler picks it up)
  GET    /reminders/{user_id}     — list all reminders for a user
  DELETE /reminders/{reminder_id} — delete a reminder

APScheduler + Twilio SMS runs in scheduler_service.py,
started on FastAPI startup event in main.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.orm import Reminder
from models.schemas import ReminderCreate

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("/create")
def create_reminder(req: ReminderCreate, db: Session = Depends(get_db)):
    """
    Create a new reminder. APScheduler picks it up on next 60-second tick.
    """
    reminder = Reminder(
        user_id      = req.user_id,
        title        = req.title,
        message      = req.message,
        remind_at    = req.remind_at,
        is_recurring = req.is_recurring,
        recur_cron   = req.recur_cron,
        phone_number = req.phone_number,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {"created": True, "id": reminder.id, "remind_at": str(reminder.remind_at)}


@router.get("/{user_id}")
def get_reminders(user_id: str, db: Session = Depends(get_db)):
    """Get all reminders for a user — used by Shivani's FamilyDashboard."""
    reminders = db.query(Reminder).filter(Reminder.user_id == user_id).all()
    return {
        "reminders": [
            {
                "id":           r.id,
                "title":        r.title,
                "message":      r.message,
                "remind_at":    str(r.remind_at),
                "is_sent":      r.is_sent,
                "is_recurring": r.is_recurring,
            }
            for r in reminders
        ]
    }


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(r)
    db.commit()
    return {"deleted": True, "id": reminder_id}
