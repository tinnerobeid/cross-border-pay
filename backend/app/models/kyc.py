from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base

class KYCProfile(Base):
    __tablename__ = "kyc_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|approved|rejected

    country: Mapped[str] = mapped_column(String(100), nullable=False)
    id_type: Mapped[str] = mapped_column(String(50), nullable=False)
    id_number: Mapped[str] = mapped_column(String(100), nullable=False)

    selfie_path: Mapped[str] = mapped_column(String(500), nullable=True)
    id_front_path: Mapped[str] = mapped_column(String(500), nullable=True)
    id_back_path: Mapped[str] = mapped_column(String(500), nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    review_note: Mapped[str] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="kyc_profile")
