from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base


class LinkedAccount(Base):
    __tablename__ = "linked_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    account_type: Mapped[str] = mapped_column(String(20), nullable=False)   # "bank" | "mobile_money"
    provider: Mapped[str] = mapped_column(String(100), nullable=False)       # "CRDB Bank", "M-Pesa"
    account_holder: Mapped[str] = mapped_column(String(255), nullable=False) # name on the account
    account_number: Mapped[str] = mapped_column(String(100), nullable=False) # account/phone number
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="linked_accounts")
