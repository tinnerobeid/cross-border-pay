from sqlalchemy import String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base

class Transfer(Base):
    __tablename__ = "transfers"

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

    provider: Mapped[str] = mapped_column(String(50), default="internal")  # mock routing output
    status: Mapped[str] = mapped_column(String(20), default="initiated")   # lifecycle

    failure_reason: Mapped[str] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transfers")
