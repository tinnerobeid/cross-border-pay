from sqlalchemy import Column, Integer, String, DateTime, Numeric
from sqlalchemy.sql import func
from app.db.database import Base

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)

    send_country = Column(String(2), nullable=False)     # TZ
    receive_country = Column(String(2), nullable=False)  # KR

    send_method = Column(String(30), nullable=False)     # mobile_money
    receive_method = Column(String(30), nullable=False)  # bank / wallet

    send_amount = Column(Numeric(18, 2), nullable=False)
    send_currency = Column(String(3), nullable=False)    # TZS
    receive_currency = Column(String(3), nullable=False) # KRW

    fx_rate = Column(Numeric(18, 6), nullable=False)     # send -> receive
    fee_amount = Column(Numeric(18, 2), nullable=False)

    provider = Column(String(50), nullable=False)        # simulated provider
    estimated_minutes = Column(Integer, nullable=False)

    status = Column(String(20), nullable=False, index=True)  # initiated/processing/sent/received/failed

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
