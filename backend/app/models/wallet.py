from sqlalchemy import String, Boolean, DateTime, Numeric, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base


# Phone prefix → default currency mapping
PHONE_CURRENCY_MAP = {
    '+255': ('TZS', 'Tanzania'),
    '+254': ('KES', 'Kenya'),
    '+250': ('RWF', 'Rwanda'),
    '+257': ('BIF', 'Burundi'),
    '+256': ('UGX', 'Uganda'),
    '+82':  ('KRW', 'South Korea'),
    '+1':   ('USD', 'United States'),
    '+44':  ('USD', 'United Kingdom'),  # GBP not yet supported, fallback
    '+49':  ('USD', 'Germany'),         # EUR not yet supported, fallback
}


def currency_from_phone(phone: str | None) -> str:
    """Detect default currency from E.164 phone number prefix."""
    if not phone:
        return 'TZS'
    for prefix, (currency, _) in PHONE_CURRENCY_MAP.items():
        if phone.startswith(prefix):
            return currency
    return 'TZS'


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(18, 2), default=0.0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wallets")

    __table_args__ = (
        UniqueConstraint("user_id", "currency", name="uq_user_currency"),
    )
