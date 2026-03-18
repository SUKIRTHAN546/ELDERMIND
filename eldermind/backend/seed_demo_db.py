"""
ElderMind — Demo Database Seeder
Owner: Sujit P

Run before every demo to create the demo elderly and family users in PostgreSQL:
  cd backend
  python seed_demo_db.py

Demo credentials:
  Elderly user — phone: +919999000001  password: demo123
  Family user  — phone: +919999000002  password: demo123
"""

import sys
sys.path.insert(0, ".")

from models.database import SessionLocal
from models.orm import User
from routers.auth import hash_password

db = SessionLocal()

elderly = User(
    id            = "demo_elderly_user",
    name          = "Meenakshi Amma",
    phone         = "+919999000001",
    password_hash = hash_password("demo123"),
    role          = "elderly",
    language      = "ta-IN",
)
family = User(
    id            = "demo_family_user",
    name          = "Karthik",
    phone         = "+919999000002",
    password_hash = hash_password("demo123"),
    role          = "family",
    language      = "en-IN",
)

db.merge(elderly)
db.merge(family)
db.commit()
db.close()

print("✓ Demo users seeded successfully.")
print("  Elderly: phone=+919999000001  password=demo123")
print("  Family:  phone=+919999000002  password=demo123")
print("\nNext: run  python ml_models/seed_demo_user.py  to load memories.")
