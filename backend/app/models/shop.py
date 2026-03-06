from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    api_key = Column(String, nullable=True) # Kaspi API Key
    percent_markup = Column(Float, default=0.0) # ПРОЦЕНТ надбавки
    delivery_plus = Column(Integer, default=0)  # Доп. дни к дате доставки
    delivery_price = Column(Float, default=0.0) # Сумма доставки (фиксированная)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="shop")
    products = relationship("Product", back_populates="shop")
