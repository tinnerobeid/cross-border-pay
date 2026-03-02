from datetime import datetime, timedelta
from sqlalchemy import String, DateTime, ForeignKey, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


QUOTE_STATUSES = ("PENDING", "CONFIRMED", "EXPIRED", "CANCELLED")


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    send_country: Mapped[str] = mapped_column(String(100), nullable=False)
    receive_country: Mapped[str] = mapped_column(String(100), nullable=False)
    send_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    receive_currency: Mapped[str] = mapped_column(String(10), nullable=False)

    send_amount: Mapped[float] = mapped_column(Float, nullable=False)
    fx_rate: Mapped[float] = mapped_column(Float, nullable=False)
    fee_amount: Mapped[float] = mapped_column(Float, nullable=False)
    receive_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)

    # Quote lifecycle
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quotes")