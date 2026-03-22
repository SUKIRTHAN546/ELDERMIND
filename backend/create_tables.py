"""
ElderMind — Create PostgreSQL Tables
Owner: Sujit P

Run once after cloning the repo and setting DATABASE_URL in .env:
  cd backend
  python create_tables.py
"""

from models.database import engine, Base
from models.orm import User, Conversation, Reminder, MemoryLog

print("Creating ElderMind database tables...")
Base.metadata.create_all(bind=engine)
print("Done. Tables created:")
for table in Base.metadata.tables:
    print(f"  ✓ {table}")
