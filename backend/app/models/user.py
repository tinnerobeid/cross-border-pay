from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")  # user|admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)  # Changed to False - needs verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)  # New field for email verification
    otp_code: Mapped[str] = mapped_column(String(6), nullable=True)  # OTP code
    otp_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)  # OTP expiration
    country_of_residence: Mapped[str] = mapped_column(String(100), nullable=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=True)  # 6-digit transaction PIN
    pending_phone: Mapped[str] = mapped_column(String(50), nullable=True)  # staged phone for change flow
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    kyc_profile = relationship("KYCProfile", back_populates="user", uselist=False)
    transfers = relationship("Transfer", back_populates="user")
    quotes = relationship("Quote", back_populates="user")
    recipients = relationship("Recipient", back_populates="user")
    wallets = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    linked_accounts = relationship("LinkedAccount", back_populates="user", cascade="all, delete-orphan")
