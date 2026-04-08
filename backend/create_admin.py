# Import all models so SQLAlchemy resolves all relationships
from app.models import user, kyc, transfer, recipient, quote  # noqa: F401
from app.db.database import SessionLocal, Base, engine
from app.models.user import User
from passlib.context import CryptContext

# Ensure all tables exist
Base.metadata.create_all(bind=engine, checkfirst=True)

db = SessionLocal()
pwd = CryptContext(schemes=["bcrypt"])

existing = db.query(User).filter(User.email == "admin@halisi.com").first()
if existing:
    print(f"Admin already exists: {existing.email}  (role={existing.role}, active={existing.is_active})")
else:
    admin = User(
        email="admin@halisi.com",
        full_name="Admin",
        phone="+255000000000",
        hashed_password=pwd.hash("Admin@2024!"),
        is_active=True,
        is_verified=True,
        role="admin",
    )
    db.add(admin)
    db.commit()
    print("Admin created successfully!")
    print("  Email:    admin@halisi.com")
    print("  Password: Admin@2024!")

db.close()
