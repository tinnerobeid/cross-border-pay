#!/usr/bin/env python
"""
Seed script to populate the database with test data.
Run with: python scripts/seed.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.kyc import KYCProfile
from datetime import datetime, timedelta

def seed_database():
    """Create tables and add sample data"""
    # Create engine and tables
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    )
    
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_user = db.query(User).filter(User.email == "user@example.com").first()
        if existing_user:
            print("✅ Database already seeded. Skipping...")
            return
        
        print("🌱 Seeding database...")
        
        # Create test users
        user1 = User(
            email="user@example.com",
            full_name="John Doe",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        
        user2 = User(
            email="jane@example.com",
            full_name="Jane Smith",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        
        admin = User(
            email="admin@example.com",
            full_name="Admin User",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add_all([user1, user2, admin])
        db.commit()
        
        # Refresh to get IDs
        db.refresh(user1)
        db.refresh(user2)
        
        # Create KYC profiles
        kyc1 = KYCProfile(
            user_id=user1.id,
            country="Tanzania",
            id_type="passport",
            id_number="PA00123456",
            status="approved",
            selfie_path="/storage/kyc/1/selfie.jpg",
            id_front_path="/storage/kyc/1/id_front.jpg",
            reviewed_at=datetime.utcnow()
        )
        
        kyc2 = KYCProfile(
            user_id=user2.id,
            country="South Korea",
            id_type="driver_license",
            id_number="DL001234567",
            status="pending",
            selfie_path="/storage/kyc/2/selfie.jpg",
            id_front_path="/storage/kyc/2/id_front.jpg"
        )
        
        db.add_all([kyc1, kyc2])
        db.commit()
        
        print("✅ Database seeded successfully!")
        print(f"  • 2 regular users + 1 admin")
        print(f"  • 1 approved KYC + 1 pending KYC")
        
        # Print login info
        print("\n🔑 Test Credentials:")
        print("  User 1: user@example.com / password123")
        print("  User 2: jane@example.com / password123")
        print("  Admin:  admin@example.com / admin123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
