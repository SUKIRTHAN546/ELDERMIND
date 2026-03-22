"""
ElderMind — SQLAlchemy ORM Models
Owner: Sujit P

4 tables cover all structured data. ChromaDB (Suchit's vector store) is separate.
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from models.database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(String,      primary_key=True)          # e.g. 'user_abc12345'
    name          = Column(String(100), nullable=False)
    phone         = Column(String(20),  unique=True, nullable=False)
    email         = Column(String(200), unique=True, nullable=True)
    password_hash = Column(String(200), nullable=False)
    role          = Column(String(20),  default="elderly")         # 'elderly' or 'family'
    language      = Column(String(10),  default="ta-IN")
    is_active     = Column(Boolean,     default=True)
    created_at    = Column(DateTime,    server_default=func.now())


class Conversation(Base):
    """Stores every conversation turn for analytics and audit trail."""
    __tablename__ = "conversations"

    id         = Column(Integer,  primary_key=True, autoincrement=True)
    user_id    = Column(String,   ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100), nullable=False)
    role       = Column(String(20),  nullable=False)               # 'user' or 'assistant'
    content    = Column(Text,        nullable=False)
    created_at = Column(DateTime,    server_default=func.now())


class Reminder(Base):
    """Medication and appointment reminders managed by Shivani's APScheduler."""
    __tablename__ = "reminders"

    id           = Column(Integer,    primary_key=True, autoincrement=True)
    user_id      = Column(String,     ForeignKey("users.id"), nullable=False)
    title        = Column(String(200), nullable=False)
    message      = Column(Text,        nullable=False)
    remind_at    = Column(DateTime,    nullable=False)
    is_recurring = Column(Boolean,     default=False)
    recur_cron   = Column(String(50),  nullable=True)
    phone_number = Column(String(20),  nullable=False)
    is_sent      = Column(Boolean,     default=False)
    created_at   = Column(DateTime,    server_default=func.now())


class MemoryLog(Base):
    """Audit log for every ChromaDB memory store/retrieve operation."""
    __tablename__ = "memory_logs"

    id           = Column(Integer,   primary_key=True, autoincrement=True)
    user_id      = Column(String,    ForeignKey("users.id"), nullable=False)
    operation    = Column(String(20), nullable=False)              # 'store' or 'retrieve'
    category     = Column(String(50), nullable=True)
    query        = Column(Text,       nullable=True)
    result_count = Column(Integer,    default=0)
    latency_ms   = Column(Float,      nullable=True)
    created_at   = Column(DateTime,   server_default=func.now())
