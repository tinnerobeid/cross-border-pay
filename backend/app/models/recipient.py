from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    bank_name = Column(String(255), nullable=True)
    account_number = Column(String(100), nullable=True)
    country = Column(String(50), nullable=False)
    currency = Column(String(3), nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="recipients")
