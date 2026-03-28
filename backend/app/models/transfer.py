from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    send_amount = Column(Numeric(18, 2), nullable=False)
    send_currency = Column(String(3), nullable=False)
    send_country = Column(String(50), nullable=True)

    receive_currency = Column(String(3), nullable=False)
    receive_country = Column(String(50), nullable=True)
    receive_amount = Column(Numeric(18, 2), nullable=True)

    recipient_name = Column(String(255), nullable=False)
    recipient_phone = Column(String(50), nullable=False)

    provider = Column(String(50), nullable=False, default="mock")

    # ✅ pricing snapshot (locked)
    rate_used = Column(Numeric(18, 8), nullable=True)
    fee_used = Column(Numeric(18, 2), nullable=True)
    zuripay_fee = Column(Numeric(18, 2), nullable=True, default=0)  # ZuriPay earnings
    transfer_type = Column(String(30), nullable=True, default="international")  # international|domestic|domestic_free
    total_payable = Column(Numeric(18, 2), nullable=True)
    priced_at = Column(DateTime(timezone=False), nullable=True)

    # ✅ state machine
    status = Column(String(30), nullable=False, default="CREATED")
    fail_reason = Column(String(255), nullable=True)

    # ✅ provider tracking
    provider_reference = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="transfers")