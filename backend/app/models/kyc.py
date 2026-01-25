from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class KYCProfile(Base):
    __tablename__ = "kyc_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    full_name = Column(String(200), nullable=True)
    nationality = Column(String(80), nullable=True)
    id_type = Column(String(50), nullable=True)      # passport/national_id/etc
    id_number = Column(String(100), nullable=True)

    status = Column(String(20), default="draft", nullable=False)  # draft/submitted/approved/rejected

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
